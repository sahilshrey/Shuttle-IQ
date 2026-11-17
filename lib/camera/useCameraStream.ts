"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeCameraError, type CameraStatus } from "@/lib/camera/camera-errors";

export type CameraDevice = {
  deviceId: string;
  label: string;
};

export type CameraStreamInfo = {
  width: number | null;
  height: number | null;
  frameRate: number | null;
};

const UNSUPPORTED_MESSAGE =
  "This browser cannot access cameras. Use a current browser over HTTPS, such as Chrome or Edge.";

function hasCameraApi() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const deviceRequestIdRef = useRef(0);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [streamInfo, setStreamInfo] = useState<CameraStreamInfo | null>(null);

  const refreshDevices = useCallback(async () => {
    const requestId = ++deviceRequestIdRef.current;
    if (!navigator.mediaDevices?.enumerateDevices) {
      setDevices([]);
      setDevicesError("Camera device selection is unavailable in this browser.");
      return [];
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      if (requestId !== deviceRequestIdRef.current) return [];
      const cameras = allDevices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
      setDevices(cameras);
      setDevicesError(null);
      return cameras;
    } catch {
      if (requestId !== deviceRequestIdRef.current) return [];
      setDevices([]);
      setDevicesError("The camera list could not be loaded. You can still try the default camera.");
      return [];
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(
    async (deviceId?: string) => {
      if (!hasCameraApi()) {
        requestIdRef.current += 1;
        stopStream();
        setStatus("unsupported");
        setErrorMessage(UNSUPPORTED_MESSAGE);
        return;
      }

      const requestId = ++requestIdRef.current;
      stopStream();
      setStatus("requesting");
      setErrorMessage(null);
      setStreamInfo(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });

        if (requestId !== requestIdRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        if (!track) {
          stopStream();
          throw new Error("The selected camera did not provide a video track.");
        }
        track.addEventListener("ended", () => {
          if (streamRef.current !== stream) return;
          stopStream();
          setStatus("error");
          setErrorMessage("The camera was disconnected. Reconnect it and start again.");
          setStreamInfo(null);
        });
        const settings = track.getSettings();
        setStreamInfo({
          width: settings.width ?? null,
          height: settings.height ?? null,
          frameRate: settings.frameRate ?? null,
        });
        const video = videoRef.current;
        if (!video) {
          stopStream();
          throw new Error("The camera preview is not ready. Try starting the camera again.");
        }
        video.srcObject = stream;
        await video.play();
        if (requestId !== requestIdRef.current || streamRef.current !== stream) {
          stream.getTracks().forEach((mediaTrack) => mediaTrack.stop());
          return;
        }

        setSelectedDeviceId(track.getSettings().deviceId ?? deviceId ?? "");
        setStatus("live");
        await refreshDevices();
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        stopStream();
        const described = describeCameraError(error);
        setStatus(described.status);
        setErrorMessage(described.message);
      }
    },
    [refreshDevices, stopStream],
  );

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    stopStream();
    setStatus("idle");
    setErrorMessage(null);
    setStreamInfo(null);
  }, [stopStream]);

  const selectDevice = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (streamRef.current) {
        void startStream(deviceId);
      }
    },
    [startStream],
  );

  useEffect(() => {
    if (!hasCameraApi()) return;
    void refreshDevices();
    const mediaDevices = navigator.mediaDevices;
    const handleDeviceChange = () => void refreshDevices();
    mediaDevices.addEventListener?.("devicechange", handleDeviceChange);
    return () => {
      mediaDevices.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, [refreshDevices]);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      deviceRequestIdRef.current += 1;
      stopStream();
    },
    [stopStream],
  );

  return {
    videoRef,
    status,
    errorMessage,
    devicesError,
    devices,
    selectedDeviceId,
    streamInfo,
    start: () => startStream(selectedDeviceId || undefined),
    stop,
    selectDevice,
  };
}
