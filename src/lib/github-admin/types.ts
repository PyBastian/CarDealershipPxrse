import type { CarJson } from "@/lib/car-json";

export type GithubFileResponse = {
  sha: string;
  path: string;
  name: string;
  type: "file" | "dir";
  size?: number;
  encoding?: string;
  content?: string;
};

export type CarFile = { slug: string; data: CarJson; sha: string };

export type SettingsFile = { data: CarDealershipSettings; sha: string };
export type CarDealershipSettings = import("@/lib/car-json").SettingsJson;

export const OWNER = "PyBastian";
export const REPO = "CarDealershipPxrse";
export const BRANCH = "main";
