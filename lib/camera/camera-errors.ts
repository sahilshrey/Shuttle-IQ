export type CameraStatus =
  | "idle"
  | "requesting"
  | "live"
  | "denied"
  | "not-found"
  | "unsupported"
  | "error";

export function describeCameraError(error: unknown): { status: CameraStatus; message: string } {
  const name = error instanceof DOMException ? error.name : "";

  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return {
        status: "denied",
        message:
          "Camera access was blocked. Allow camera permission in your browser settings, then try again.",
      };
    case "NotFoundError":
    case "OverconstrainedError":
      return {
        status: "not-found",
        message: "No matching camera was found. Connect a camera or choose a different one.",
      };
    case "NotReadableError":
    case "AbortError":
      return {
        status: "error",
        message: "The camera is busy or could not be read. Close other apps using it and try again.",
      };
    default:
      return {
        status: "error",
        message: "The camera could not be started. Please try again.",
      };
  }
}
