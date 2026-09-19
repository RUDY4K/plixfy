# عقد مهمة وكيل

يملأ المدير هذا العقد لكل وكيل قبل تشغيله.

```yaml
task_id: PLX-YYYYMMDD-NNN
run_id: RUN-YYYYMMDD-NNN
parent_task_id: null
owner_agent: role-id
objective: نتيجة واحدة قابلة للتحقق
status: planned
action_kind: observe | public-research | draft | repository-write | external-send | publish | deploy | financial-change | delete | credential-change
risk_level: low | medium | high | critical
executor: codex-native-agent | isolated-read-runner | isolated-write-runner | approved-connector
required_capabilities: []
execution_mode: read_only
no_workspace_writes: true
wave: 1
dependencies: []
created_at: ISO-8601
started_at: null
finished_at: null
base_commit: git-sha
in_scope:
  - عنصر مسموح
out_of_scope:
  - عنصر ممنوع
inputs:
  - ملف أو رابط أو حقيقة
data_definition: تعريف المقياس والفترة ووحدة التحليل
assumptions: []
confidence_scale: low | medium | high مع سبب
data_access_method: conversation | approved-read-only-connector | repository-public-files
data_scope:
  - الحقول والفترات المسموحة فقط
pii_policy: aggregated-only-no-personal-data
allowed_tools:
  - أدوات القراءة أو الكتابة المسموحة
tool_ids: []
connector_ids: []
write_ownership:
  create_exact: []
  replace_exact: []
  delete_exact: []
forbidden_paths:
  - .env*
  - .private/**
network_allowlist: []
budget:
  time_minutes: يحدده المدير
  external_calls: يحدده المدير
  owner_approved_limit: null
  requires_approval_if_exceeded: true
approval_gate:
  required: false
  owner: user
  approval_id: null
  action: null
  scope: null
  destination: null
  expires_at: null
  reversible: true
acceptance_checks:
  - اختبار أو دليل مطلوب
output_channel: manager-message
output_path: null
deliverable: شكل التسليم للمدير
handoff_to: plixfy-manager
```

في وضع `no_workspace_writes: true` يجب أن يبقى `output_path: null` ويسلّم الوكيل
النتيجة للمدير عبر الرسالة فقط. في أوضاع الكتابة، يحدد المدير مسارًا خارج ملفات
ذاكرة المدير؛ ثم ينسخ المدير وحده الملخص المعتمد إلى سجل التشغيل.

في `isolated_write` يدعم v2.0 `create_exact` و`replace_exact` فقط. يجب أن يبقى
`delete_exact` فارغًا، ويكون `output_path` ملف patch داخل مجلد التشغيل المؤقت.
لا تمنح الموافقة على إنشاء patch صلاحية commit أو merge أو push أو deploy.
ولا تمنح موافقة `external-send` أو `publish` صلاحية لأي وجهة أخرى أو لإجراء
مالي أو حذف أو تغيير اعتماد؛ ينشئ المدير بوابة مستقلة لكل فئة أثر.

## صيغة تسليم الوكيل

1. النتيجة المختصرة.
2. الأدلة ومصادرها.
3. الملفات التي تغيّرت، إن وجدت.
4. الاختبارات ونتائجها.
5. المخاطر أو نقاط عدم اليقين.
6. ما يحتاج قرار المدير أو موافقة المالك.
