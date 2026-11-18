import type { Plan, StoreData } from "./model";
import { solveGreedy } from "./solve-greedy";

/** The solver the app uses. Swap this one line to change solver (e.g. a later ILP version). */
export const solve: (data: StoreData) => Plan = solveGreedy;
