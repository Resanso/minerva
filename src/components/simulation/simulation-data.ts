import models from "../../../public/3d-model/models.json";

export type SimulationStep = {
  id: string;
  baseId: string;
  name: string;
  modelSrc: string;
  duration: number; // seconds spent on this machine
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  occurrence: number;
};

type RawModel = {
  id: string;
  src: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

const toTitleCase = (text: string) =>
  text
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

// Normalize incoming JSON to the strict RawModel shape.
// models.json can contain arrays typed as `number[]` (not fixed-length tuples),
// so convert and validate them here instead of using an unsafe direct cast.
const rawModels: RawModel[] = (models as unknown as any[]).map((m) => {
  const position =
    Array.isArray(m.position) && m.position.length === 3
      ? ([m.position[0], m.position[1], m.position[2]] as [
          number,
          number,
          number
        ])
      : undefined;

  const rotation =
    Array.isArray(m.rotation) && m.rotation.length === 3
      ? ([m.rotation[0], m.rotation[1], m.rotation[2]] as [
          number,
          number,
          number
        ])
      : undefined;

  return {
    id: String(m.id),
    src: String(m.src),
    position,
    rotation,
    scale: typeof m.scale === "number" ? m.scale : undefined,
  };
});

const idUsage = new Map<string, number>();

export const simulationSteps: SimulationStep[] = rawModels.map(
  (model, index) => {
    const occurrence = (idUsage.get(model.id) ?? 0) + 1;
    idUsage.set(model.id, occurrence);

    const stepId = occurrence === 1 ? model.id : `${model.id}-${occurrence}`;
    const baseName = model.id ? toTitleCase(model.id) : `Step ${index + 1}`;
    const displayName =
      occurrence === 1 ? baseName : `${baseName} ${occurrence}`;
    const baseDuration = 12;
    const durationVariant = (index % 4) * 4; // adds subtle variation per station

    return {
      id: stepId,
      baseId: model.id,
      name: displayName,
      modelSrc: model.src,
      duration: baseDuration + durationVariant,
      position: model.position,
      rotation: model.rotation,
      scale: model.scale,
      occurrence,
    } satisfies SimulationStep;
  }
);

export const machineRegistry: Record<string, SimulationStep> =
  simulationSteps.reduce((acc, step) => {
    acc[step.id] = step;
    return acc;
  }, {} as Record<string, SimulationStep>);

export const baseMachineRegistry: Record<string, SimulationStep[]> =
  simulationSteps.reduce((acc, step) => {
    const list = acc[step.baseId] ?? [];
    list.push(step);
    acc[step.baseId] = list;
    return acc;
  }, {} as Record<string, SimulationStep[]>);

export function cloneStep(
  step: SimulationStep,
  overrides?: Partial<SimulationStep>
): SimulationStep {
  return {
    ...step,
    ...overrides,
  };
}
