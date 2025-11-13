"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import MachineStreamTooltip from "./MachineStreamTooltip";
import { useSensorStream } from "./useSensorStream";

type MachinePosition = {
  machineName: string;
  screenX: number;
  screenY: number;
};

type MachineStreamTooltipsProps = {
  camera: THREE.PerspectiveCamera | null;
  // The map may contain either THREE.Object3D instances or wrapper objects
  // (e.g. { object: THREE.Object3D, baseScale, basePosition }) created by
  // `SimulationScene`. We'll accept `any` and unwrap at runtime.
  machineObjects: Map<string, any>;
  containerWidth: number;
  containerHeight: number;
};

// Mapping eksplisit dari InfluxDB machine name ke 3D model ID
const mapInfluxToModelId = (influxName: string): string[] => {
  const lower = influxName.toLowerCase();

  // Hapus suffix angka seperti -01, -02, dst
  const baseName = lower.replace(/-\d+$/, "");

  const mapping: Record<string, string[]> = {
    furnace: ["furnace", "furnace2"], // Furnace-01 & Furnace-02
    "rod-feeder": ["rod-feeder"], // Rod-Feeder-01
    ut: ["ut"], // UT-01
    "casting-machine": ["casting-machine"], // Casting-Machine-01
    ct: ["ct-1", "ct-2", "ct-3", "ct-4"], // CT-01 to CT-04
    homogenizing: ["homogenizing"], // Homogenizing-01
    "charging-machine": ["charging-machine"], // Charging-Machine-01
    swarf: ["swarf"], // Swarf-01
    sawing: ["sawing"], // Sawing-01
    weightning: ["weightning"], // Weightning-01
    weighing: ["weightning"], // alias untuk typo
  };

  return mapping[baseName] || [];
};

const findMatchingObject = (
  machineName: string,
  machineObjects: Map<string, any>
): THREE.Object3D | null => {
  // Coba mapping eksplisit dulu
  const possibleIds = mapInfluxToModelId(machineName);

  for (const modelId of possibleIds) {
    // Cek langsung di Map
    if (machineObjects.has(modelId)) {
      const val = machineObjects.get(modelId);
      // unwrap potential wrapper
      if (val && typeof (val as any).updateWorldMatrix === "function") {
        return val as THREE.Object3D;
      }
      if (
        val &&
        val.object &&
        typeof val.object.updateWorldMatrix === "function"
      ) {
        return val.object as THREE.Object3D;
      }
    }

    // Cek case-insensitive
    for (const [objId, obj] of machineObjects) {
      if (objId.toLowerCase() === modelId.toLowerCase()) {
        if (obj && typeof obj.updateWorldMatrix === "function") return obj;
        if (
          obj &&
          obj.object &&
          typeof obj.object.updateWorldMatrix === "function"
        )
          return obj.object;
      }
    }

    // Cek via userData.stepId
    for (const [, obj] of machineObjects) {
      const candidate =
        obj && typeof obj.updateWorldMatrix === "function" ? obj : obj?.object;
      const stepId = candidate?.userData?.stepId;
      if (stepId && stepId.toLowerCase() === modelId.toLowerCase()) {
        return candidate;
      }
    }
  }

  // Fallback: fuzzy matching
  const normalized = machineName.toLowerCase().replace(/[-_\s\d]+/g, "");
  for (const [objId, obj] of machineObjects) {
    const normalizedObjId = objId.toLowerCase().replace(/[-_\s\d]+/g, "");
    if (
      normalizedObjId.includes(normalized) ||
      normalized.includes(normalizedObjId)
    ) {
      if (obj && typeof obj.updateWorldMatrix === "function") return obj;
      if (
        obj &&
        obj.object &&
        typeof obj.object.updateWorldMatrix === "function"
      )
        return obj.object;
      return null;
    }
  }

  return null;
};

export default function MachineStreamTooltips({
  camera,
  machineObjects,
  containerWidth,
  containerHeight,
}: MachineStreamTooltipsProps) {
  const { readings } = useSensorStream({ limit: 32 });
  const [machinePositions, setMachinePositions] = useState<MachinePosition[]>(
    []
  );
  const rafRef = useRef<number | null>(null);

  const latestMachine = useMemo(() => {
    if (readings.length === 0) return null;

    // Cari reading dengan timestamp terbaru
    let latest = readings[0];
    for (const reading of readings) {
      if (reading.time > latest.time) {
        latest = reading;
      }
    }

    return latest.machineName;
  }, [readings]);

  useEffect(() => {
    if (!camera || machineObjects.size === 0 || !latestMachine) {
      setMachinePositions([]);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const updatePositions = () => {
      const positions: MachinePosition[] = [];
      const vector = new THREE.Vector3();

      // Hanya proses mesin dengan data terbaru
      const obj = findMatchingObject(latestMachine, machineObjects);

      if (!obj) {
        console.warn(
          `[MachineStreamTooltips] No 3D object found for machine: ${latestMachine}`,
          `Available objects:`,
          Array.from(machineObjects.keys())
        );
      }

      if (obj) {
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(vector);
        const top = new THREE.Vector3(center.x, box.max.y, center.z);
        top.project(camera);

        const screenX = ((top.x + 1) / 2) * containerWidth;
        const screenY = ((-top.y + 1) / 2) * containerHeight;

        if (
          screenX >= 0 &&
          screenX <= containerWidth &&
          screenY >= 0 &&
          screenY <= containerHeight
        ) {
          positions.push({
            machineName: latestMachine,
            screenX,
            screenY,
          });
        }
      }

      setMachinePositions(positions);
      rafRef.current = requestAnimationFrame(updatePositions);
    };

    updatePositions();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [camera, machineObjects, latestMachine, containerWidth, containerHeight]);

  return (
    <>
      {machinePositions.map((pos) => (
        <MachineStreamTooltip
          key={pos.machineName}
          machineName={pos.machineName}
          readings={readings}
          screenPosition={{ x: pos.screenX, y: pos.screenY }}
        />
      ))}
    </>
  );
}
