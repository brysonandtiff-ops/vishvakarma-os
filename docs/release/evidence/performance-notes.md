# Performance Notes — Editor performance overhaul

Generated from commit: `6abb1336fa37f62d420b90e231779224054fce72`
Generated at: 2026-08-07T12:58:54.037Z
Operator: automated local verify
Result: PASS — build artifact produced locally

## Build size

| Metric | Value |
|---|---|
| dist/ total | 0.00 MB |

## Chunk breakdown

| Chunk | Raw size |
|---|---|
| vendor-3d-text | 791.1 kB |
| index | 739.2 kB |
| vendor-charts | 388.4 kB |
| vendor-misc | 375.7 kB |
| EditorPage | 250.5 kB |
| vendor-supabase | 190.8 kB |
| vendor-ui | 167.9 kB |
| vendor-react-three-drei | 159.6 kB |
| vendor-export | 93.6 kB |
| vendor-postprocessing | 88.3 kB |
| vendor-collab | 80.8 kB |
| OptimizationPage | 63.4 kB |
| vendor-utils | 55.7 kB |
| Viewport3D | 53.3 kB |
| orchestrator | 41.5 kB |
| vendor-router | 41.1 kB |
| lightingPresets | 23.4 kB |
| ReleasesPage | 15.4 kB |
| vendor-upload | 15.0 kB |
| CastSessionManager | 14.0 kB |
| ProjectsPage | 13.6 kB |
| CollabSession | 13.3 kB |
| LandingPage | 13.0 kB |
| LiteEditorPage | 12.6 kB |
| appVersion | 12.3 kB |
| vendor-ui-helpers | 11.9 kB |
| localProjects | 11.8 kB |
| vayuCFD | 11.6 kB |
| AuthPage | 11.5 kB |
| SpecCenterPage | 11.2 kB |
| releaseGateManifest | 10.6 kB |
| ChangeRequestsPage | 10.4 kB |
| vendor-3d-helpers | 9.3 kB |
| CastViewerPage | 8.9 kB |
| RegistryPage | 8.8 kB |
| AuditLogPage | 8.5 kB |
| planningPipeline | 8.2 kB |
| PricingPage | 7.8 kB |
| api | 7.2 kB |
| WorldRecordsPage | 7.0 kB |
| FeaturesPage | 6.6 kB |
| ProfilePage | 6.3 kB |
| ThreeDRoomPage | 5.9 kB |
| planning.worker | 4.2 kB |
| dropdown | 4.0 kB |
| vendor-three-core | 3.7 kB |
| vendor-analytics | 3.7 kB |
| minimalPdf | 3.3 kB |
| select | 3.2 kB |
| worldRecordRegistry | 2.7 kB |
| roomTypeColors | 2.2 kB |
| MarketingSection | 2.1 kB |
| panchatattva | 1.9 kB |
| billingPlans | 1.7 kB |
| GovernanceBackendBanner | 1.7 kB |
| PageStateBlock | 1.6 kB |
| card | 1.5 kB |
| NotFound | 1.4 kB |
| supabaseProjectGateway | 1.3 kB |
| tabs | 1.2 kB |
| WorkspacePanel | 1.2 kB |
| MarketingCtaSection | 1.1 kB |
| rolldown | 986 B |
| localDraft | 924 B |
| input | 920 B |
| slider | 889 B |
| vendor-react | 857 B |
| fetchWithRetry | 835 B |
| Viewport3DLoading | 786 B |
| MetricPill | 738 B |
| roomType | 673 B |
| textarea | 610 B |
| stripeCheckout | 605 B |
| ResetPasswordPage | 590 B |
| GovernanceStatPill | 544 B |
| label | 530 B |
| separator | 522 B |
| StatPill | 416 B |
| supabaseAccessToken | 294 B |
| projectThumbnail | 229 B |

## Bundle report

WARN  Unsupported engine: wanted: {"node":"20.x"} (current: {"node":"v24.18.1","pnpm":"9.15.0"})

> vishvakarma-os@1.5.0 perf:report C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live
> node scripts/performance/report-bundle.mjs

# Vishvakarma.OS Bundle Report

Generated: 2026-08-07T13:15:18.998Z
dist total: 3.84 MB (3.84 MB)

| Chunk | Raw | Gzip | Delta vs baseline | Files |
| --- | --- | --- | --- | --- |
| vendor-3d-text | 791.1 kB | 207.8 kB | 0 B | vendor-3d-text-BalsG9IO.js |
| index | 739.2 kB | 148.3 kB | 0 B | index-C8xWdqFF.css, index-CL-bgM94.js |
| vendor-charts | 388.4 kB | 88.5 kB | 0 B | vendor-charts-Bx0qo6B7.js |
| vendor-misc | 375.7 kB | 92.7 kB | 0 B | vendor-misc-D7iSeYn8.css, vendor-misc-GCBstE0X.js |
| EditorPage | 250.5 kB | 69.2 kB | 0 B | EditorPage-BfPULV1E.js |
| vendor-supabase | 190.8 kB | 48.1 kB | 0 B | vendor-supabase-BCq_g81B.js |
| vendor-ui | 167.9 kB | 43.9 kB | 0 B | vendor-ui-Db5Wjv7D.js |
| vendor-react-three-drei | 159.6 kB | 43.7 kB | 0 B | vendor-react-three-drei-D4OlMHHG.js |
| vendor-export | 93.6 kB | 22.9 kB | 0 B | vendor-export-COfF8FNT.js |
| vendor-postprocessing | 88.3 kB | 10 B | 0 B | vendor-postprocessing-CTm6EVxW.js |
| vendor-collab | 80.8 kB | 23.3 kB | 0 B | vendor-collab-BGy18YXM.js |
| OptimizationPage | 63.4 kB | 10 B | 0 B | OptimizationPage-D2JNJycW.js |
| vendor-utils | 55.7 kB | 10 B | 0 B | vendor-utils-pMEt00wa.js |
| Viewport3D | 53.3 kB | 10 B | 0 B | Viewport3D-456yTxEk.js |
| orchestrator | 41.5 kB | 10 B | 0 B | orchestrator-BZ_UrSdW.js |
| vendor-router | 41.1 kB | 10 B | 0 B | vendor-router-DNmedEvC.js |
| lightingPresets | 23.4 kB | 10 B | 0 B | lightingPresets-BpcWDNc9.js |
| ReleasesPage | 15.4 kB | 10 B | 0 B | ReleasesPage-CNTmzPUf.js |
| vendor-upload | 15.0 kB | 10 B | 0 B | vendor-upload-DBzdm65B.js |
| CastSessionManager | 14.0 kB | 182 B | 0 B | CastSessionManager-Bokfzh1_.js, CastSessionManager-IWpDQXyk.js |
| ProjectsPage | 13.6 kB | 10 B | 0 B | ProjectsPage-Dn904d_Z.js |
| CollabSession | 13.3 kB | 10 B | 0 B | CollabSession-DmEnscMk.js |
| LandingPage | 13.0 kB | 10 B | 0 B | LandingPage-D5SyB2vA.js |
| LiteEditorPage | 12.6 kB | 10 B | 0 B | LiteEditorPage-Bs9x98Jk.js |
| appVersion | 12.3 kB | 10 B | 0 B | appVersion-BB60Cy3W.js |
| vendor-ui-helpers | 11.9 kB | 10 B | 0 B | vendor-ui-helpers-DQAlGJ9p.js |
| localProjects | 11.8 kB | 4.4 kB | 0 B | localProjects-2v6Ydnj9.js |
| vayuCFD | 11.6 kB | 10 B | 0 B | vayuCFD-DJuqwqGq.js |
| AuthPage | 11.5 kB | 10 B | 0 B | AuthPage-CW32hGRd.js |
| SpecCenterPage | 11.2 kB | 10 B | 0 B | SpecCenterPage-BV1TLsI0.js |
| releaseGateManifest | 10.6 kB | 10 B | 0 B | releaseGateManifest-C7i3e171.js |
| ChangeRequestsPage | 10.4 kB | 3.2 kB | 0 B | ChangeRequestsPage-CAZ2bBPn.js |
| vendor-3d-helpers | 9.3 kB | 10 B | 0 B | vendor-3d-helpers-DfsJ1qul.js |
| CastViewerPage | 8.9 kB | 3.2 kB | 0 B | CastViewerPage-DYVHx_sW.js |
| RegistryPage | 8.8 kB | 10 B | 0 B | RegistryPage-BdmJSv9W.js |
| AuditLogPage | 8.5 kB | 2.9 kB | 0 B | AuditLogPage-B4AHBATf.js |
| planningPipeline | 8.2 kB | 10 B | 0 B | planningPipeline-C0abmIdB.js |
| PricingPage | 7.8 kB | 10 B | 0 B | PricingPage-DZIeNrQI.js |
| api | 7.2 kB | 10 B | 0 B | api-AiPSf6lj.js |
| WorldRecordsPage | 7.0 kB | 10 B | 0 B | WorldRecordsPage-DNEjQLEF.js |
| FeaturesPage | 6.6 kB | 10 B | 0 B | FeaturesPage-Df9Oqazn.js |
| ProfilePage | 6.3 kB | 10 B | 0 B | ProfilePage-_JQdGihI.js |
| ThreeDRoomPage | 5.9 kB | 10 B | 0 B | ThreeDRoomPage-pv7Jps1F.js |
| planning.worker | 4.2 kB | 1.8 kB | 0 B | planning.worker-C8slriou.js |
| dropdown | 4.0 kB | 10 B | 0 B | dropdown-menu-CudzyCh7.js |
| vendor-three-core | 3.7 kB | 10 B | 0 B | vendor-three-core-Bm0iHikm.js |
| vendor-analytics | 3.7 kB | 1.6 kB | 0 B | vendor-analytics-DUsSDltu.js |
| minimalPdf | 3.3 kB | 10 B | 0 B | minimalPdf-a-wAkhj8.js |
| select | 3.2 kB | 10 B | 0 B | select-B3taXVzS.js |
| worldRecordRegistry | 2.7 kB | 10 B | 0 B | worldRecordRegistry-DaSx7ILH.js |
| roomTypeColors | 2.2 kB | 10 B | 0 B | roomTypeColors-C-fxbBHI.js |
| MarketingSection | 2.1 kB | 10 B | 0 B | MarketingSection-C3AjUSJh.js |
| panchatattva | 1.9 kB | 10 B | 0 B | panchatattva-Ch7XUae0.js |
| billingPlans | 1.7 kB | 934 B | 0 B | billingPlans-CuOmxPv7.js |
| GovernanceBackendBanner | 1.7 kB | 10 B | 0 B | GovernanceBackendBanner-DaJ0f_mg.js |
| PageStateBlock | 1.6 kB | 675 B | 0 B | PageStateBlock-BqBoVWl9.js |
| card | 1.5 kB | 10 B | 0 B | card-BeW4gOZP.js |
| NotFound | 1.4 kB | 10 B | 0 B | NotFound-Ck16lmtq.js |
| supabaseProjectGateway | 1.3 kB | 10 B | 0 B | supabaseProjectGateway-fyLOxS3M.js |
| tabs | 1.2 kB | 10 B | 0 B | tabs-BRyiQnaz.js |
| WorkspacePanel | 1.2 kB | 610 B | 0 B | WorkspacePanel-DQ08rxTc.js |
| MarketingCtaSection | 1.1 kB | 10 B | 0 B | MarketingCtaSection-DchPlaAB.js |
| rolldown | 986 B | 10 B | 0 B | rolldown-runtime-BE_SCnlJ.js |
| localDraft | 924 B | 10 B | 0 B | localDraft-CEn1qFGg.js |
| input | 920 B | 10 B | 0 B | input-BqPrABvV.js |
| slider | 889 B | 500 B | 0 B | slider-hci_GdjG.js |
| vendor-react | 857 B | 524 B | 0 B | vendor-react-QtMrIiND.js |
| fetchWithRetry | 835 B | 90 B | 0 B | fetchWithRetry-CAn3fp67.js, fetchWithRetry-s_cvMtnD.js |
| Viewport3DLoading | 786 B | 10 B | 0 B | Viewport3DLoading-DFukxG_V.js |
| MetricPill | 738 B | 452 B | 0 B | MetricPill-B7ONpoJl.js |
| roomType | 673 B | 325 B | 0 B | roomType-6AUNh5wq.js |
| textarea | 610 B | 398 B | 0 B | textarea-DmKndp10.js |
| stripeCheckout | 605 B | 365 B | 0 B | stripeCheckout-YxXknG1Y.js |
| ResetPasswordPage | 590 B | 10 B | 0 B | ResetPasswordPage-BUxuYBvj.js |
| GovernanceStatPill | 544 B | 10 B | 0 B | GovernanceStatPill-DkkeudxF.js |
| label | 530 B | 10 B | 0 B | label-C1MqrdEO.js |
| separator | 522 B | 10 B | 0 B | separator-DlzOuny1.js |
| StatPill | 416 B | 10 B | 0 B | StatPill-B6vdLb5a.js |
| supabaseAccessToken | 294 B | 228 B | 0 B | supabaseAccessToken-DTJWFE5r.js |
| projectThumbnail | 229 B | 199 B | 0 B | projectThumbnail-BUp-MKjS.js |

Wrote C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\docs\release\evidence\build-output.txt

## Runtime Interaction Checks

- Build completes under local verify pipeline.
- 3D vendor chunk isolated via `manualChunks` in vite.config.ts.
- Manual iPad interaction and 3D update latency still require device evidence.
