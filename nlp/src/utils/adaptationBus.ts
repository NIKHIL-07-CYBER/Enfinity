import EventEmitter from "eventemitter3";

/**
 * adaptationBus — the single shared event bus for the Adaptive Reader.
 *
 * Owner: Dev C (NLP / Adaptation layer)
 * All teammates import from THIS file. Never create a separate EventEmitter.
 *
 * Events you LISTEN to (produced by Dev B — Telemetry):
 *   adaptationBus.on("triggerAdaptation", (event: TriggerAdaptationEvent) => { ... })
 *
 * Events you EMIT (consumed by Dev A — UI):
 *   adaptationBus.emit("adaptation", event: AdaptationEvent)
 *
 * CRITICAL: This file must be committed and importable before any other
 * teammate begins integration. Dev A and Dev B are blocked until this exists.
 */
export const adaptationBus = new EventEmitter();
