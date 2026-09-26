export type LeftMode = "chat" | "agent";

export type RightPanel = "layers" | "inspect" | "info" | null;

export type BasemapId = "dark" | "satellite";

export type MapTool = "pan" | "place-point" | "inspect-pixel";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

export type MockLayerKind = "fill" | "circle";

export interface MockLayer {
  id: string;
  name: string;
  meta: string;
  color: string;
  visible: boolean;
  kind: MockLayerKind;
  geojson: GeoJSON.FeatureCollection;
}

export interface MockUser {
  name: string;
  initial: string;
}

export interface InspectResult {
  kind: "pixel" | "point";
  lng: number;
  lat: number;
  values?: { band: string; value: string }[];
}
