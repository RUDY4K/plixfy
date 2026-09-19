---
role_id: unique-task-role
name: اسم وصفي
reports_to: plixfy-manager
access_tier: read-only
can_delegate: false
contract_version: 1
secrets_access: denied
network_policy: task-allowlist
default_write_scope: none
---

# الغرض

مسؤولية واحدة ضيقة قابلة للتحقق. لا يغيّر هذا الملف السياسة المركزية في
`policy.json` ولا يمنح صلاحية بحد ذاته؛ عقد المهمة والمشغّل يطبقان الأقل صلاحية.

# التسليم

نتيجة وأدلة وافتراضات ودرجة ثقة ومخاطر، ثم تسليم للمدير عبر الرسالة.
