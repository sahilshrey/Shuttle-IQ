"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CameraPanel } from "@/components/live-court/CameraPanel";
import { CourtSetupPanel } from "@/components/live-court/CourtSetupPanel";
import { SystemStatusPanel } from "@/components/live-court/SystemStatusPanel";
import {
  DEFAULT_COURT_ENVIRONMENT,
  DEFAULT_MATCH_FORMAT,
  type CourtEnvironmentId,
  type MatchFormat,
} from "@/lib/court-config";
import { useCameraStream } from "@/lib/camera/useCameraStream";

export function LiveCourtView() {
  const [matchFormat, setMatchFormat] = useState<MatchFormat>(DEFAULT_MATCH_FORMAT);
  const [environment, setEnvironment] = useState<CourtEnvironmentId>(DEFAULT_COURT_ENVIRONMENT);
  const camera = useCameraStream();

  const selectedCamera = camera.devices.find((device) => device.deviceId === camera.selectedDeviceId);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Live Court"
        title="Court monitoring"
        subtitle="Set up the match, check the camera framing, and confirm the system is ready."
      />

      <div className="live-layout">
        <div className="stack">
          <CameraPanel
            videoRef={camera.videoRef}
            status={camera.status}
            errorMessage={camera.errorMessage}
            devices={camera.devices}
            selectedDeviceId={camera.selectedDeviceId}
            onStart={camera.start}
            onStop={camera.stop}
            onSelectDevice={camera.selectDevice}
          />
          <CourtSetupPanel
            matchFormat={matchFormat}
            environment={environment}
            onMatchFormatChange={setMatchFormat}
            onEnvironmentChange={setEnvironment}
          />
        </div>

        <div className="stack">
          <SystemStatusPanel
            cameraStatus={camera.status}
            cameraLabel={selectedCamera?.label ?? null}
          />
        </div>
      </div>
    </div>
  );
}
