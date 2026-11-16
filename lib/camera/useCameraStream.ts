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
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [streamInfo, setStreamInfo] = useState<CameraStreamInfo | null>(null);

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const cameras = allDevices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
      }));
    setDevices(cameras);
    return cameras;
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
        setStatus("unsupported");
        setErrorMessage(UNSUPPORTED_MESSAGE);
        return;
      }

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

        const track = stream.getVideoTracks()[0];
        track.addEventListener("ended", () => {
          if (streamRef.current !== stream) return;
          stopStream();
          setStatus("error");
          setErrorMessage("The camera was disconnected. Reconnect it and start again.");
          setStreamInfo(null);
        });

        streamRef.current = stream;
        const settings = track.getSettings();
        setStreamInfo({
          width: settings.width ?? null,
          height: settings.height ?? null,
          frameRate: settings.frameRate ?? null,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setSelectedDeviceId(track.getSettings().deviceId ?? deviceId ?? "");
        setStatus("live");
        await refreshDevices();
      } catch (error) {
        const described = describeCameraError(error);
        setStatus(described.status);
        setErrorMessage(described.message);
      }
    },
    [refreshDevices, stopStream],
  );

  const stop = useCallback(() => {
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
    const handleDeviceChange = () => void refreshDevices();
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshDevices]);

  useEffect(() => () => stopStream(), [stopStream]);

  return {
    videoRef,
    status,
    errorMessage,
    devices,
    selectedDeviceId,
    streamInfo,
    start: () => startStream(selectedDeviceId || undefined),
    stop,
    selectDevice,
  };
}
