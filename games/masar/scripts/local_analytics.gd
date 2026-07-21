class_name LocalAnalytics
extends RefCounted

const DEV_PATH := "user://masar_analytics_dev.jsonl"


func record(event_name: String, properties := {}) -> void:
    var payload := {
        "timestamp_ms": int(Time.get_unix_time_from_system() * 1000.0),
        "event": event_name,
        "properties": properties,
    }
    var file: FileAccess
    if FileAccess.file_exists(DEV_PATH):
        file = FileAccess.open(DEV_PATH, FileAccess.READ_WRITE)
        if file:
            file.seek_end()
    else:
        file = FileAccess.open(DEV_PATH, FileAccess.WRITE_READ)
    if file:
        file.store_line(JSON.stringify(payload))


func get_dev_path() -> String:
    return DEV_PATH
