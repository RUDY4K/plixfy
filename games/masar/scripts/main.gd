extends Control

const ArrowBoardScript = preload("res://scripts/arrow_board.gd")
const AbstractBackdropScript = preload("res://scripts/abstract_backdrop.gd")
const LocalAnalyticsScript = preload("res://scripts/local_analytics.gd")
const UI_FONT = preload("res://assets/fonts/Manrope.ttf")
const SAVE_PATH := "user://masar_progress.cfg"

const LEVEL_THEMES := [
    {"name": "Cobalt", "primary": Color("#5B7CFF")},
    {"name": "Coral", "primary": Color("#FF6B5F")},
    {"name": "Forest", "primary": Color("#35C997")},
    {"name": "Violet", "primary": Color("#A57AF5")},
    {"name": "Amber", "primary": Color("#F4B84A")},
]
const TYPE := Color("#F8FAFC")
const TYPE_MUTED := Color("#B9C2CF")
const DARK_INK := Color("#10131A")

var BG := Color("#101735")
var PANEL := Color("#172249")
var PANEL_SOFT := Color("#213268")
var PRIMARY := Color("#5B7CFF")
var ACCENT := Color("#5B7CFF")
var TEXT := TYPE
var MUTED := TYPE_MUTED
var INK := DARK_INK
var active_theme: Dictionary = LEVEL_THEMES[0]

var content: Control
var backdrop: AbstractBackdrop
var analytics: LocalAnalytics
var run_timer_label: Label
var current_level := 1
var total_score := 0
var last_score := 0
var last_combo := 0
var last_mistakes := 0
var return_streak := 1
var last_play_day := -1
var game_mode := "home"
var run_started_ms := 0
var daily_day := -1
var daily_best_score := 0
var daily_best_time_ms := 0
var daily_best_mistakes := 0


func _ready() -> void:
    layout_direction = Control.LAYOUT_DIRECTION_LTR
    analytics = LocalAnalyticsScript.new()
    _load_progress()
    _refresh_daily_state()
    _register_daily_return()
    for argument in OS.get_cmdline_user_args():
        if argument.begins_with("--preview-level="):
            current_level = maxi(1, int(argument.trim_prefix("--preview-level=")))
    _build_backdrop()
    analytics.record("session_start", {"level_color": str(_theme_for_level(current_level).name), "level": current_level})
    if "--preview-game" in OS.get_cmdline_user_args():
        _show_game("journey")
    elif "--preview-daily" in OS.get_cmdline_user_args():
        _show_game("daily")
    elif "--preview-result" in OS.get_cmdline_user_args():
        _show_result()
    else:
        _show_game("journey")


func _process(_delta: float) -> void:
    if game_mode == "daily" and run_started_ms > 0 and is_instance_valid(run_timer_label):
        run_timer_label.text = _format_time(Time.get_ticks_msec() - run_started_ms)


func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("back"):
        _show_home()


func _build_backdrop() -> void:
    backdrop = AbstractBackdropScript.new()
    backdrop.name = "AbstractBackdrop"
    backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    backdrop.configure(_theme_for_level(current_level))
    add_child(backdrop)
    move_child(backdrop, 0)


func _theme_for_level(level: int) -> Dictionary:
    var theme: Dictionary = LEVEL_THEMES[posmod(level - 1, LEVEL_THEMES.size())].duplicate()
    theme.bg = theme.primary.darkened(0.76)
    theme.panel = theme.primary.darkened(0.66)
    theme.panel_soft = theme.primary.darkened(0.54)
    theme.accent = theme.primary
    theme.text = TYPE
    theme.muted = TYPE_MUTED
    theme.ink = DARK_INK
    return theme


func _apply_level_theme(level: int) -> void:
    active_theme = _theme_for_level(level)
    BG = active_theme.bg
    PANEL = active_theme.panel
    PANEL_SOFT = active_theme.panel_soft
    PRIMARY = active_theme.primary
    ACCENT = active_theme.primary
    TEXT = active_theme.text
    MUTED = active_theme.muted
    INK = active_theme.ink
    if is_instance_valid(backdrop):
        backdrop.configure(active_theme)


func _reset_content() -> MarginContainer:
    if is_instance_valid(content):
        content.queue_free()
    var margin := MarginContainer.new()
    margin.name = "ScreenContent"
    margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    margin.add_theme_constant_override("margin_left", 64)
    margin.add_theme_constant_override("margin_right", 64)
    margin.add_theme_constant_override("margin_top", 54)
    margin.add_theme_constant_override("margin_bottom", 54)
    margin.modulate.a = 0.0
    add_child(margin)
    content = margin
    var tween := create_tween()
    tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
    tween.tween_property(margin, "modulate:a", 1.0, 0.18)
    return margin


func _show_home() -> void:
    game_mode = "home"
    _apply_level_theme(current_level)
    run_started_ms = 0
    run_timer_label = null
    _refresh_daily_state()
    analytics.record("home_view", {"level": current_level, "daily_complete": daily_best_score > 0})
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.add_theme_constant_override("separation", 0)
    margin.add_child(column)

    var header := HBoxContainer.new()
    header.add_child(_left_label("MASAR", 46, TEXT, true))
    var header_space := Control.new()
    header_space.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    header.add_child(header_space)
    header.add_child(_right_label("◆  %d     STREAK  %d" % [total_score, return_streak], 20, TEXT, true))
    column.add_child(header)
    column.add_child(_vertical_space(38))
    column.add_child(_label("JOURNEY %02d" % _journey_number(), 21, MUTED, true))

    var portal_wrap := CenterContainer.new()
    portal_wrap.custom_minimum_size.y = 690
    column.add_child(portal_wrap)
    var outer_portal := PanelContainer.new()
    outer_portal.custom_minimum_size = Vector2(620, 620)
    outer_portal.add_theme_stylebox_override("panel", _panel_style(Color(PRIMARY, 0.10), Color(PRIMARY, 0.34), 310, 8))
    portal_wrap.add_child(outer_portal)
    var portal_center := CenterContainer.new()
    outer_portal.add_child(portal_center)
    var inner_portal := PanelContainer.new()
    inner_portal.custom_minimum_size = Vector2(470, 470)
    inner_portal.add_theme_stylebox_override("panel", _panel_style(PRIMARY, Color(TEXT, 0.52), 235, 8))
    portal_center.add_child(inner_portal)
    var portal_copy := VBoxContainer.new()
    portal_copy.alignment = BoxContainer.ALIGNMENT_CENTER
    portal_copy.add_theme_constant_override("separation", 2)
    portal_copy.add_child(_label("LEVEL", 21, Color(INK, 0.70), true))
    portal_copy.add_child(_label("%02d" % current_level, 136, INK, true))
    portal_copy.add_child(_label(str(active_theme.name).to_upper(), 19, Color(INK, 0.70), true))
    inner_portal.add_child(portal_copy)

    column.add_child(_level_nodes())
    column.add_child(_vertical_space(28))
    var play := _button("PLAY  ▶", 38, PRIMARY, INK)
    play.custom_minimum_size.y = 110
    play.pressed.connect(_show_game.bind("journey"))
    column.add_child(play)
    var event_space := Control.new()
    event_space.custom_minimum_size.y = 30
    event_space.size_flags_vertical = Control.SIZE_EXPAND_FILL
    column.add_child(event_space)

    var daily_event := PanelContainer.new()
    daily_event.custom_minimum_size.y = 170
    daily_event.add_theme_stylebox_override("panel", _panel_style(Color(PANEL, 0.94), Color(PRIMARY, 0.26), 18, 3))
    column.add_child(daily_event)
    var daily_row := HBoxContainer.new()
    daily_row.add_theme_constant_override("separation", 24)
    daily_event.add_child(daily_row)
    var daily_copy := VBoxContainer.new()
    daily_copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    daily_copy.add_theme_constant_override("separation", 7)
    daily_copy.add_child(_left_label("⚡  DAILY CHALLENGE", 20, PRIMARY, true))
    daily_copy.add_child(_left_label(_daily_date_text(), 34, TEXT, true))
    var best_text := "NO RUN YET" if daily_best_score <= 0 else "BEST  %s  •  %d" % [_format_time(daily_best_time_ms), daily_best_score]
    daily_copy.add_child(_left_label(best_text, 19, MUTED))
    daily_row.add_child(daily_copy)
    var daily_play := _button("GO", 28, PRIMARY, INK)
    daily_play.custom_minimum_size = Vector2(190, 112)
    daily_play.pressed.connect(_show_game.bind("daily"))
    daily_row.add_child(daily_play)

func _show_game(mode_name := "journey") -> void:
    game_mode = mode_name
    _apply_level_theme(daily_day if game_mode == "daily" else current_level)
    var profile := _daily_profile_for_day(daily_day) if game_mode == "daily" else _level_profile(current_level)
    var margin := _reset_content()
    margin.add_theme_constant_override("margin_top", 30)
    margin.add_theme_constant_override("margin_bottom", 34)
    var column := VBoxContainer.new()
    column.add_theme_constant_override("separation", 14)
    margin.add_child(column)

    var top := HBoxContainer.new()
    column.add_child(top)
    top.add_child(_compact_button("←", _show_home))
    var top_space := Control.new()
    top_space.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(top_space)
    var title := "DAILY CHALLENGE" if game_mode == "daily" else "LEVEL %02d" % current_level
    top.add_child(_label(title, 34, TEXT, true))
    var top_space_two := Control.new()
    top_space_two.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(top_space_two)
    if game_mode == "daily":
        run_timer_label = _right_label("00:00.0", 27, PRIMARY, true)
    else:
        run_timer_label = _right_label("◆  0", 27, PRIMARY, true)
    run_timer_label.custom_minimum_size.x = 190
    top.add_child(run_timer_label)

    var game_status := HBoxContainer.new()
    game_status.add_theme_constant_override("separation", 18)
    column.add_child(game_status)
    var difficulty := Label.new()
    difficulty.text = _difficulty_text(int(profile.target))
    difficulty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    difficulty.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    difficulty.custom_minimum_size = Vector2(170, 54)
    difficulty.add_theme_font_override("font", _ui_font(700))
    difficulty.add_theme_font_size_override("font_size", 18)
    difficulty.add_theme_color_override("font_color", INK)
    difficulty.add_theme_stylebox_override("normal", _panel_style(PRIMARY, Color.TRANSPARENT, 27, 0))
    game_status.add_child(difficulty)
    var status_label := _label("Find an open path", 22, MUTED)
    status_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    game_status.add_child(status_label)
    var clean_label := _right_label("◆ ◆ ◆", 22, TEXT, true)
    clean_label.custom_minimum_size.x = 180
    game_status.add_child(clean_label)
    var progress := _progress_bar()
    column.add_child(progress)

    var board_frame := PanelContainer.new()
    board_frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
    board_frame.add_theme_stylebox_override("panel", _panel_style(Color.TRANSPARENT, Color.TRANSPARENT, 18, 0))
    column.add_child(board_frame)
    var board: ArrowBoard = ArrowBoardScript.new()
    board.name = "ArrowBoard"
    board.apply_palette(active_theme)
    board.configure(profile.columns, profile.rows, profile.target, profile.seed)
    board.progress_changed.connect(func(remaining: int, total: int, combo: int, score: int) -> void:
        if game_mode != "daily":
            run_timer_label.text = "◆  %d" % score
        progress.value = float(total - remaining) / float(maxi(1, total)) * 100.0
        status_label.text = "%d LEFT" % remaining
        if combo >= 3:
            status_label.text = "FLOW ×%d  •  %d LEFT" % [combo, remaining]
    )
    board.blocked_tap.connect(func() -> void:
        status_label.text = "BLOCKED  •  TRY ANOTHER"
        var clean_count := maxi(0, 3 - board.get_mistakes())
        clean_label.text = "◆ ".repeat(clean_count).strip_edges() + " ◇".repeat(3 - clean_count)
        analytics.record("blocked_tap", {"mode": game_mode, "level": current_level})
    )
    board.hint_used.connect(func() -> void:
        analytics.record("hint_used", {"mode": game_mode, "level": current_level})
    )
    board.level_cleared.connect(func(score: int, best_combo: int) -> void:
        var elapsed_ms := maxi(1, Time.get_ticks_msec() - run_started_ms)
        if game_mode == "daily":
            _complete_daily(elapsed_ms, board.get_mistakes(), board.get_hints_used(), best_combo)
        else:
            _complete_level(score, best_combo, board.get_mistakes(), elapsed_ms, board.get_hints_used())
    )
    board_frame.add_child(board)

    var tools := HBoxContainer.new()
    tools.alignment = BoxContainer.ALIGNMENT_CENTER
    tools.add_theme_constant_override("separation", 22)
    column.add_child(tools)
    var restart := _button("↻  RESTART", 22, PANEL_SOFT, TEXT)
    restart.custom_minimum_size = Vector2(300, 86)
    restart.pressed.connect(func() -> void:
        board.new_level()
        run_started_ms = Time.get_ticks_msec()
        clean_label.text = "◆ ◆ ◆"
        analytics.record("run_restart", {"mode": game_mode, "level": current_level})
    )
    tools.add_child(restart)
    var hint_text := "?  HINT +10s" if game_mode == "daily" else "?  HINT"
    var hint := _button(hint_text, 22, PRIMARY, INK)
    hint.custom_minimum_size = Vector2(300, 86)
    hint.pressed.connect(board.show_hint)
    tools.add_child(hint)
    run_started_ms = Time.get_ticks_msec()
    analytics.record("run_start", {
        "mode": game_mode,
        "level": current_level,
        "daily_day": daily_day if game_mode == "daily" else 0,
        "tiles": int(profile.target),
    })


func _complete_level(score: int, best_combo: int, mistakes: int, elapsed_ms: int, hints: int) -> void:
    last_score = score
    last_combo = best_combo
    last_mistakes = mistakes
    total_score += score
    analytics.record("run_complete", {
        "mode": "journey",
        "level": current_level,
        "score": score,
        "elapsed_ms": elapsed_ms,
        "mistakes": mistakes,
        "hints": hints,
    })
    current_level += 1
    run_started_ms = 0
    _save_progress()
    _show_result()


func _complete_daily(elapsed_ms: int, mistakes: int, hints: int, best_combo: int) -> void:
    var score := calculate_daily_score(elapsed_ms, mistakes, hints)
    var is_new_best := score > daily_best_score
    if is_new_best:
        daily_best_score = score
        daily_best_time_ms = elapsed_ms
        daily_best_mistakes = mistakes
        _save_progress()
    analytics.record("run_complete", {
        "mode": "daily",
        "daily_day": daily_day,
        "score": score,
        "elapsed_ms": elapsed_ms,
        "mistakes": mistakes,
        "hints": hints,
        "new_best": is_new_best,
    })
    run_started_ms = 0
    _show_daily_result(score, elapsed_ms, mistakes, hints, best_combo, is_new_best)


func _show_result() -> void:
    game_mode = "result"
    _apply_level_theme(maxi(1, current_level - 1))
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 20)
    margin.add_child(column)
    column.add_child(_left_label("LEVEL %02d COMPLETE" % (current_level - 1), 20, MUTED, true))
    column.add_child(_left_label("CLEAR.", 92, TEXT, true))

    var medal_count := 3 if last_mistakes == 0 else (2 if last_mistakes <= 2 else 1)
    var medal_text := ""
    for index in range(3):
        medal_text += "◆  " if index < medal_count else "◇  "

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 400)
    card.add_theme_stylebox_override("panel", _panel_style(PRIMARY, Color.TRANSPARENT, 6, 0))
    column.add_child(card)
    var stats := VBoxContainer.new()
    stats.add_theme_constant_override("separation", 18)
    card.add_child(stats)
    stats.add_child(_left_label("+%d" % last_score, 76, INK, true))
    stats.add_child(_left_label("GLOW  /  BEST FLOW ×%d" % last_combo, 23, Color(INK, 0.76), true))
    stats.add_child(_left_label(medal_text.strip_edges(), 42, INK))
    stats.add_child(_left_label(_result_message(medal_count), 22, Color(INK, 0.76)))

    var next := _button("NEXT LEVEL  →", 32, TEXT, BG)
    next.custom_minimum_size.y = 96
    next.pressed.connect(_show_game.bind("journey"))
    column.add_child(next)


func _show_daily_result(score: int, elapsed_ms: int, mistakes: int, hints: int, best_combo: int, is_new_best: bool) -> void:
    game_mode = "daily_result"
    _apply_level_theme(daily_day)
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 20)
    margin.add_child(column)
    column.add_child(_left_label("DAILY COMPLETE", 20, MUTED, true))
    column.add_child(_left_label("%d" % score, 104, TEXT, true))
    column.add_child(_left_label("NEW PERSONAL BEST" if is_new_best else "RUN COMPLETE", 27, PRIMARY, true))

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 410)
    card.add_theme_stylebox_override("panel", _panel_style(PANEL, Color.TRANSPARENT, 16, 0))
    column.add_child(card)
    var stats := VBoxContainer.new()
    stats.add_theme_constant_override("separation", 22)
    card.add_child(stats)
    stats.add_child(_stat_row("TIME", _format_time(elapsed_ms)))
    stats.add_child(_stat_row("MISTAKES", "%d" % mistakes))
    stats.add_child(_stat_row("HINTS", "%d" % hints))
    stats.add_child(_stat_row("BEST FLOW", "×%d" % best_combo))

    var replay := _button("RUN AGAIN  →", 32, PRIMARY, INK)
    replay.custom_minimum_size.y = 92
    replay.pressed.connect(_show_game.bind("daily"))
    column.add_child(replay)
    var home := _button("BACK HOME", 25, Color.TRANSPARENT, TEXT)
    home.custom_minimum_size.y = 76
    home.pressed.connect(_show_home)
    column.add_child(home)


func calculate_daily_score(elapsed_ms: int, mistakes: int, hints: int) -> int:
    return maxi(100, 10000 - int(elapsed_ms / 10.0) - mistakes * 500 - hints * 1000)


func _difficulty_text(target: int) -> String:
    if target <= 10:
        return "EASY"
    if target <= 18:
        return "NORMAL"
    if target <= 24:
        return "HARD"
    return "EXPERT"


func _level_profile(level: int) -> Dictionary:
    var columns := mini(6, 4 + (level - 1) / 4)
    var rows := columns + 2
    var target := 26
    if level <= 4:
        target = 6 + (level - 1) * 2
    elif level <= 8:
        target = 18 + (level - 5) * 2
    target = mini(target, columns * rows - 2)
    return {"columns": columns, "rows": rows, "target": target, "seed": level * 104729}


func _daily_profile_for_day(day: int) -> Dictionary:
    return {"columns": 5, "rows": 7, "target": 24, "seed": day * 104729 + 7001}


func get_level_profile_for_test(level: int) -> Dictionary:
    return _level_profile(level)


func get_daily_profile_for_test(day: int) -> Dictionary:
    return _daily_profile_for_day(day)


func get_level_color_for_test(level: int) -> Color:
    return _theme_for_level(level).primary


func get_analytics_path_for_test() -> String:
    return analytics.get_dev_path()


func _journey_number() -> int:
    return int((current_level - 1) / 5) + 1


func _vertical_space(height: int) -> Control:
    var space := Control.new()
    space.custom_minimum_size.y = height
    return space


func _level_nodes() -> HBoxContainer:
    var marks := HBoxContainer.new()
    marks.alignment = BoxContainer.ALIGNMENT_CENTER
    marks.add_theme_constant_override("separation", 24)
    var route := (current_level - 1) % 5
    for index in range(5):
        var mark := PanelContainer.new()
        var node_size := 78 if index == route else 58
        mark.custom_minimum_size = Vector2(node_size, node_size)
        var fill := PRIMARY if index < route else (TEXT if index == route else PANEL_SOFT)
        var border := TEXT if index == route else Color(PRIMARY, 0.62)
        mark.add_theme_stylebox_override("panel", _panel_style(fill, border, node_size / 2, 5))
        var number_color := BG if index <= route else MUTED
        mark.add_child(_label("%d" % (index + 1), 21, number_color, true))
        marks.add_child(mark)
    return marks


func _result_message(medals: int) -> String:
    if medals == 3:
        return "Perfect route. No wasted moves."
    if medals == 2:
        return "One more clean run for all three diamonds."
    return "Route cleared. The next one will feel sharper."


func _journey_progress() -> VBoxContainer:
    var wrap := VBoxContainer.new()
    wrap.custom_minimum_size = Vector2(600, 58)
    wrap.add_theme_constant_override("separation", 7)
    var within := (current_level - 1) % 5
    var copy := HBoxContainer.new()
    copy.add_child(_left_label("JOURNEY %d" % _journey_number(), 19, MUTED, true))
    var copy_space := Control.new()
    copy_space.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    copy.add_child(copy_space)
    copy.add_child(_right_label("%d / 5" % within, 19, PRIMARY, true))
    wrap.add_child(copy)
    var bar := _progress_bar()
    bar.value = float(within) / 5.0 * 100.0
    wrap.add_child(bar)
    return wrap


func _progress_bar() -> ProgressBar:
    var bar := ProgressBar.new()
    bar.custom_minimum_size = Vector2(0, 12)
    bar.show_percentage = false
    bar.min_value = 0
    bar.max_value = 100
    bar.add_theme_stylebox_override("background", _bar_style(Color(PANEL_SOFT, 0.82)))
    bar.add_theme_stylebox_override("fill", _bar_style(PRIMARY))
    return bar


func _metric_box(title: String, value: String, color: Color) -> PanelContainer:
    var box := PanelContainer.new()
    box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    box.custom_minimum_size.y = 94
    box.add_theme_stylebox_override("panel", _panel_style(Color(PANEL, 0.76), Color(color, 0.32), 14, 1))
    var copy := VBoxContainer.new()
    copy.add_theme_constant_override("separation", 4)
    copy.add_child(_left_label(title, 17, MUTED, true))
    copy.add_child(_left_label(value, 25, color, true))
    box.add_child(copy)
    return box


func _stat_row(title: String, value: String) -> HBoxContainer:
    var row := HBoxContainer.new()
    row.add_child(_left_label(title, 22, MUTED, true))
    var space := Control.new()
    space.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    row.add_child(space)
    row.add_child(_right_label(value, 28, TEXT, true))
    return row


func _label(value: String, font_size: int, color: Color, bold := false) -> Label:
    var label := Label.new()
    label.text = value
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    label.autowrap_mode = TextServer.AUTOWRAP_OFF
    label.add_theme_font_override("font", _ui_font(700 if bold else 400))
    label.add_theme_font_size_override("font_size", font_size)
    label.add_theme_color_override("font_color", color)
    return label


func _left_label(value: String, font_size: int, color: Color, bold := false) -> Label:
    var label := _label(value, font_size, color, bold)
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
    label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    return label


func _right_label(value: String, font_size: int, color: Color, bold := false) -> Label:
    var label := _label(value, font_size, color, bold)
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    return label


func _button(value: String, font_size: int, background: Color, foreground: Color) -> Button:
    var button := Button.new()
    button.text = value
    button.focus_mode = Control.FOCUS_NONE
    button.custom_minimum_size = Vector2(220, 82)
    button.add_theme_font_override("font", _ui_font(650))
    button.add_theme_font_size_override("font_size", font_size)
    button.add_theme_color_override("font_color", foreground)
    button.add_theme_color_override("font_pressed_color", foreground.darkened(0.10))
    button.add_theme_stylebox_override("normal", _panel_style(background, Color.TRANSPARENT, 6, 0))
    button.add_theme_stylebox_override("hover", _panel_style(background.lightened(0.06), Color.TRANSPARENT, 6, 0))
    button.add_theme_stylebox_override("pressed", _panel_style(background.darkened(0.08), Color.TRANSPARENT, 6, 0))
    return button


func _ui_font(weight: int) -> FontVariation:
    var font := FontVariation.new()
    font.base_font = UI_FONT
    font.variation_opentype = {"wght": weight}
    return font


func _compact_button(value: String, action: Callable) -> Button:
    var button := _button(value, 38, Color.TRANSPARENT, TEXT)
    button.custom_minimum_size = Vector2(76, 70)
    button.pressed.connect(action)
    return button


func _panel_style(background: Color, border: Color, radius: int, border_width: int) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = background
    style.border_color = border
    style.set_border_width_all(border_width)
    style.set_corner_radius_all(radius)
    style.content_margin_left = 24
    style.content_margin_right = 24
    style.content_margin_top = 20
    style.content_margin_bottom = 20
    return style


func _bar_style(color: Color) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = color
    style.set_corner_radius_all(4)
    return style


func _format_time(elapsed_ms: int) -> String:
    var total_tenths := maxi(0, elapsed_ms) / 100
    var minutes := int(total_tenths / 600)
    var seconds := int(total_tenths / 10) % 60
    var tenths := int(total_tenths % 10)
    return "%02d:%02d.%d" % [minutes, seconds, tenths]


func _daily_date_text() -> String:
    var date := Time.get_date_dict_from_unix_time(daily_day * 86400)
    var months := ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    return "%s %02d" % [months[int(date.month) - 1], int(date.day)]


func _refresh_daily_state() -> void:
    var today := int(Time.get_unix_time_from_system() / 86400.0)
    if daily_day == today:
        return
    daily_day = today
    daily_best_score = 0
    daily_best_time_ms = 0
    daily_best_mistakes = 0
    _save_progress()


func _register_daily_return() -> void:
    var today := int(Time.get_unix_time_from_system() / 86400.0)
    if last_play_day < 0:
        return_streak = 1
    elif today == last_play_day + 1:
        return_streak += 1
    elif today > last_play_day + 1:
        return_streak = 1
    last_play_day = today
    _save_progress()


func _load_progress() -> void:
    var config := ConfigFile.new()
    if config.load(SAVE_PATH) != OK:
        return
    current_level = maxi(1, int(config.get_value("player", "level", 1)))
    total_score = maxi(0, int(config.get_value("player", "score", 0)))
    return_streak = maxi(1, int(config.get_value("player", "return_streak", 1)))
    last_play_day = int(config.get_value("player", "last_play_day", -1))
    daily_day = int(config.get_value("daily", "day", -1))
    daily_best_score = maxi(0, int(config.get_value("daily", "best_score", 0)))
    daily_best_time_ms = maxi(0, int(config.get_value("daily", "best_time_ms", 0)))
    daily_best_mistakes = maxi(0, int(config.get_value("daily", "best_mistakes", 0)))


func _save_progress() -> void:
    var config := ConfigFile.new()
    config.set_value("player", "level", current_level)
    config.set_value("player", "score", total_score)
    config.set_value("player", "return_streak", return_streak)
    config.set_value("player", "last_play_day", last_play_day)
    config.set_value("daily", "day", daily_day)
    config.set_value("daily", "best_score", daily_best_score)
    config.set_value("daily", "best_time_ms", daily_best_time_ms)
    config.set_value("daily", "best_mistakes", daily_best_mistakes)
    config.save(SAVE_PATH)
