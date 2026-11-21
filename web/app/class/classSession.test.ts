import { describe, expect, it, vi } from "vitest";
import { createClassSession } from "./classSession";

function fakeStream() {
  const track = { stop: vi.fn() };
  return { stream: { getTracks: () => [track] } as unknown as MediaStream, track };
}

function fakeParts() {
  return { recorder: { start: vi.fn(), stop: vi.fn() }, recognizer: { start: vi.fn(), stop: vi.fn() } };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe("createClassSession", () => {
  it("starts recorder and recognizer and returns the assembled value", async () => {
    const { stream } = fakeStream();
    const parts = fakeParts();
    const session = createClassSession();
    const result = await session.start({
      openStream: async () => stream,
      openSession: async () => "s1",
      assemble: () => ({ ...parts, value: 42 }),
    });
    expect(result).toEqual({ status: "started", value: 42 });
    expect(parts.recorder.start).toHaveBeenCalled();
    expect(parts.recognizer.start).toHaveBeenCalled();
  });

  it("stop() stops recognizer, recorder and mic tracks once", async () => {
    const { stream, track } = fakeStream();
    const parts = fakeParts();
    const session = createClassSession();
    await session.start({ openStream: async () => stream, openSession: async () => "s1", assemble: () => ({ ...parts, value: 1 }) });
    session.stop();
    session.stop();
    expect(parts.recognizer.stop).toHaveBeenCalledTimes(1);
    expect(parts.recorder.stop).toHaveBeenCalledTimes(1);
    expect(track.stop).toHaveBeenCalledTimes(1);
  });

  it("disposing while the session request is pending stops the stream and starts nothing", async () => {
    const { stream, track } = fakeStream();
    const pending = deferred<string | undefined>();
    const assemble = vi.fn();
    const session = createClassSession();
    const started = session.start({ openStream: async () => stream, openSession: () => pending.promise, assemble });
    await Promise.resolve();
    await Promise.resolve();
    session.dispose();
    pending.resolve("s1");
    expect(await started).toEqual({ status: "cancelled" });
    expect(track.stop).toHaveBeenCalled();
    expect(assemble).not.toHaveBeenCalled();
  });

  it("disposing while getUserMedia is pending stops the late stream", async () => {
    const { stream, track } = fakeStream();
    const pending = deferred<MediaStream>();
    const session = createClassSession();
    const started = session.start({ openStream: () => pending.promise, openSession: async () => "s1", assemble: vi.fn() });
    session.dispose();
    pending.resolve(stream);
    expect(await started).toEqual({ status: "cancelled" });
    expect(track.stop).toHaveBeenCalled();
  });

  it("a second start stops the first session's resources", async () => {
    const first = fakeStream();
    const firstParts = fakeParts();
    const second = fakeStream();
    const session = createClassSession();
    await session.start({ openStream: async () => first.stream, openSession: async () => "a", assemble: () => ({ ...firstParts, value: 1 }) });
    await session.start({ openStream: async () => second.stream, openSession: async () => "b", assemble: () => ({ ...fakeParts(), value: 2 }) });
    expect(first.track.stop).toHaveBeenCalled();
    expect(firstParts.recognizer.stop).toHaveBeenCalled();
    expect(second.track.stop).not.toHaveBeenCalled();
  });

  it("reports stream and session failures, releasing the stream on session failure", async () => {
    const { stream, track } = fakeStream();
    const session = createClassSession();
    const noStream = await session.start({
      openStream: async () => {
        throw new Error("denied");
      },
      openSession: async () => "s",
      assemble: vi.fn(),
    });
    expect(noStream).toEqual({ status: "stream-failed" });
    const noSession = await session.start({ openStream: async () => stream, openSession: async () => undefined, assemble: vi.fn() });
    expect(noSession).toEqual({ status: "session-failed" });
    expect(track.stop).toHaveBeenCalled();
  });
});
