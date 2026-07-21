extends Control

const ArrowBoardScript = preload("res://scripts/arrow_board.gd")
const AbstractBackdropScript = preload("res://scripts/abstract_backdrop.gd")
const SAVE_PATH := "user://masar_progress.cfg"

const PALETTES := [
    {
        "name": "Ocean",
        "bg": Color("#071A2B"),
        "panel": Color("#0E2638"),
        "panel_soft": Color("#17364A"),
        "primary": Color("#5EEAD4"),
        "accent": Color("#93C5FD"),
        "text": Color("#F8FAFC"),
        "muted": Color("#A8BACB"),
        "ink": Color("#092033"),
        "tiles": [Color("#67E8F9"), Color("#5EEAD4"), Color("#93C5FD"), Color("#A7F3D0")],
    },
    {
        "name": "Aurora",
        "bg": Color("#101126"),
        "panel": Color("#1A1C3A"),
        "panel_soft": Color("#292953"),
        "primary": Color("#A78BFA"),
        "accent": Color("#67E8F9"),
        "text": Color("#FAF8FF"),
        "muted": Color("#BBB8D2"),
        "ink": Color("#17162C"),
        "tiles": [Color("#C4B5FD"), Color("#A78BFA"), Color("#67E8F9"), Color("#A5B4FC")],
    },
    {
        "name": "Sunset",
        "bg": Color("#21131F"),
        "panel": Color("#332031"),
        "panel_soft": Color("#482A3E"),
        "primary": Color("#FB7185"),
        "accent": Color("#FBBF7A"),
        "text": Color("#FFF8F5"),
        "muted": Color("#D3B8C4"),
        "ink": Color("#2B1724"),
        "tiles": [Color("#FDA4AF"), Color("#F9A8D4"), Color("#FCD34D"), Color("#C4B5FD")],
    },
]

var BG := Color("#071A2B")
var PANEL := Color("#0E2638")
var PANEL_SOFT := Color("#17364A")
var PRIMARY := Color("#5EEAD4")
var ACCENT := Color("#93C5FD")
var TEXT := Color("#F8FAFC")
var MUTED := Color("#A8BACB")
var INK := Color("#092033")

var content: Control
var backdrop: AbstractBackdrop
var current_palette := 0
var current_level := 1
var total_score := 0
var last_score := 0
var last_combo := 0
var last_mistakes := 0
var return_streak := 1
var last_play_day := -1


func _ready() -> void:
    layout_direction = Control.LAYOUT_DIRECTION_LTR
    _load_progress()
    for argument in OS.get_cmdline_user_args():
        if argument.begins_with("--palette="):
            current_palette = clampi(int(argument.trim_prefix("--palette=")), 0, PALETTES.size() - 1)
    _apply_palette(current_palette)
    _register_daily_return()
    _build_backdrop()
    if "--preview-game" in OS.get_cmdline_user_args():
        _show_game()
    elif "--preview-result" in OS.get_cmdline_user_args():
        _show_result()
    else:
        _show_home()


func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("back"):
        _show_home()


func _build_backdrop() -> void:
    backdrop = AbstractBackdropScript.new()
    backdrop.name = "AbstractBackdrop"
    backdrop.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    backdrop.configure(PALETTES[current_palette])
    add_child(backdrop)
    move_child(backdrop, 0)


func _apply_palette(index: int) -> void:
    current_palette = clampi(index, 0, PALETTES.size() - 1)
    var palette: Dictionary = PALETTES[current_palette]
    BG = palette.bg
    PANEL = palette.panel
    PANEL_SOFT = palette.panel_soft
    PRIMARY = palette.primary
    ACCENT = palette.accent
    TEXT = palette.text
    MUTED = palette.muted
    INK = palette.ink
    if is_instance_valid(backdrop):
        backdrop.configure(palette)


func _select_palette(index: int) -> void:
    _apply_palette(index)
    _save_progress()
    _show_home()


func _reset_content() -> MarginContainer:
    if is_instance_valid(content):
        content.queue_free()
    var margin := MarginContainer.new()
    margin.name = "ScreenContent"
    margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    margin.add_theme_constant_override("margin_left", 58)
    margin.add_theme_constant_override("margin_right", 58)
    margin.add_theme_constant_override("margin_top", 48)
    margin.add_theme_constant_override("margin_bottom", 48)
    margin.modulate.a = 0.0
    add_child(margin)
    content = margin
    var tween := create_tween()
    tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
    tween.tween_property(margin, "modulate:a", 1.0, 0.20)
    return margin


func _show_home() -> void:
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 18)
    margin.add_child(column)

    column.add_child(_label("MASAR", 84, PRIMARY, true))
    column.add_child(_label("Clear your mind. Open the path.", 31, MUTED))

    var journey := HBoxContainer.new()
    journey.alignment = BoxContainer.ALIGNMENT_CENTER
    journey.add_theme_constant_override("separation", 16)
    column.add_child(journey)
    journey.add_child(_pill("Journey %d" % _journey_number(), PRIMARY))
    journey.add_child(_pill("Daily streak %d" % return_streak, ACCENT))

    column.add_child(_label("CHOOSE YOUR LOOK", 22, Color(MUTED, 0.86), true))
    var palette_row := HBoxContainer.new()
    palette_row.alignment = BoxContainer.ALIGNMENT_CENTER
    palette_row.add_theme_constant_override("separation", 12)
    column.add_child(palette_row)
    for index in range(PALETTES.size()):
        palette_row.add_child(_palette_button(index))

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 560)
    card.add_theme_stylebox_override("panel", _panel_style(Color(PANEL, 0.96), Color(PRIMARY, 0.58), 42, 3))
    column.add_child(card)
    var card_column := VBoxContainer.new()
    card_column.alignment = BoxContainer.ALIGNMENT_CENTER
    card_column.add_theme_constant_override("separation", 24)
    card.add_child(card_column)
    card_column.add_child(_label("LEVEL %d" % current_level, 50, TEXT, true))
    card_column.add_child(_label("Tap an arrow with an open path\nand build a perfect flow.", 31, MUTED))
    card_column.add_child(_journey_progress())
    var play := _button("PLAY NOW", 44, PRIMARY, INK)
    play.custom_minimum_size = Vector2(0, 106)
    play.pressed.connect(_show_game)
    card_column.add_child(play)

    column.add_child(_label("%d  TOTAL GLOW" % total_score, 29, ACCENT, true))
    column.add_child(_label("Short sessions  •  Calm motion  •  No penalties", 23, Color(MUTED, 0.82)))


func _show_game() -> void:
    var margin := _reset_content()
    margin.add_theme_constant_override("margin_top", 34)
    margin.add_theme_constant_override("margin_bottom", 44)
    var column := VBoxContainer.new()
    column.add_theme_constant_override("separation", 17)
    margin.add_child(column)

    var top := HBoxContainer.new()
    column.add_child(top)
    top.add_child(_round_button("×", 58, _show_home))
    var spacer := Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer)
    top.add_child(_label("LEVEL %d" % current_level, 38, TEXT, true))
    var spacer_two := Control.new()
    spacer_two.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer_two)
    var score_label := _label("0  ◆", 30, ACCENT, true)
    score_label.custom_minimum_size.x = 180
    top.add_child(score_label)

    var status_label := _label("Choose an arrow with an open path", 27, MUTED)
    column.add_child(status_label)
    var progress := _progress_bar()
    column.add_child(progress)

    var board_frame := PanelContainer.new()
    board_frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
    board_frame.add_theme_stylebox_override("panel", _panel_style(Color.TRANSPARENT, Color.TRANSPARENT, 38, 0))
    column.add_child(board_frame)
    var board: ArrowBoard = ArrowBoardScript.new()
    board.name = "ArrowBoard"
    board.apply_palette(PALETTES[current_palette])
    var profile := _level_profile(current_level)
    board.configure(profile.columns, profile.rows, profile.target, current_level * 104729)
    board.progress_changed.connect(func(remaining: int, total: int, combo: int, score: int) -> void:
        score_label.text = "%d  ◆" % score
        progress.value = float(total - remaining) / float(maxi(1, total)) * 100.0
        status_label.text = "%d remaining" % remaining
        if combo >= 3:
            status_label.text = "FLOW ×%d   •   %d remaining" % [combo, remaining]
    )
    board.blocked_tap.connect(func() -> void:
        status_label.text = "Blocked path — try another arrow"
    )
    board.level_cleared.connect(func(score: int, best_combo: int) -> void:
        _complete_level(score, best_combo, board.get_mistakes())
    )
    board_frame.add_child(board)

    var hint := _button("SHOW AN OPEN PATH", 27, PANEL_SOFT, PRIMARY)
    hint.custom_minimum_size.y = 78
    hint.pressed.connect(board.show_hint)
    column.add_child(hint)


func _complete_level(score: int, best_combo: int, mistakes: int) -> void:
    last_score = score
    last_combo = best_combo
    last_mistakes = mistakes
    total_score += score
    current_level += 1
    _save_progress()
    _show_result()


func _show_result() -> void:
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 26)
    margin.add_child(column)
    column.add_child(_label("BEAUTIFUL FLOW", 70, PRIMARY, true))

    var medal_count := 3 if last_mistakes == 0 else (2 if last_mistakes <= 2 else 1)
    var medal_text := ""
    for index in range(3):
        medal_text += "◆  " if index < medal_count else "◇  "
    column.add_child(_label(medal_text.strip_edges(), 62, ACCENT))

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 500)
    card.add_theme_stylebox_override("panel", _panel_style(PANEL, Color(PRIMARY, 0.58), 40, 3))
    column.add_child(card)
    var stats := VBoxContainer.new()
    stats.alignment = BoxContainer.ALIGNMENT_CENTER
    stats.add_theme_constant_override("separation", 27)
    card.add_child(stats)
    stats.add_child(_label("+%d GLOW" % last_score, 54, ACCENT, true))
    stats.add_child(_label("Best flow ×%d" % last_combo, 36, TEXT))
    stats.add_child(_label(_result_message(medal_count), 28, MUTED))
    stats.add_child(_journey_progress())

    var next := _button("NEXT LEVEL", 42, PRIMARY, INK)
    next.custom_minimum_size.y = 108
    next.pressed.connect(_show_game)
    column.add_child(next)


func _level_profile(level: int) -> Dictionary:
    var columns := mini(6, 4 + (level - 1) / 4)
    var rows := columns + 2
    var gentle_target := 6 + (level - 1) * 2
    var target := mini(26, mini(columns * rows - 2, gentle_target))
    return {"columns": columns, "rows": rows, "target": target}


func get_level_profile_for_test(level: int) -> Dictionary:
    return _level_profile(level)


func get_palette_count_for_test() -> int:
    return PALETTES.size()


func _journey_number() -> int:
    return int((current_level - 1) / 5) + 1


func _result_message(medals: int) -> String:
    if medals == 3:
        return "Perfect run — keep the streak alive"
    if medals == 2:
        return "So close — collect all three diamonds"
    return "Path cleared — the next run will be better"


func _journey_progress() -> VBoxContainer:
    var wrap := VBoxContainer.new()
    wrap.custom_minimum_size = Vector2(640, 72)
    wrap.add_theme_constant_override("separation", 8)
    var within := (current_level - 1) % 5
    wrap.add_child(_label("JOURNEY PROGRESS  %d / 5" % within, 22, MUTED))
    var bar := _progress_bar()
    bar.value = float(within) / 5.0 * 100.0
    wrap.add_child(bar)
    return wrap


func _progress_bar() -> ProgressBar:
    var bar := ProgressBar.new()
    bar.custom_minimum_size = Vector2(0, 18)
    bar.show_percentage = false
    bar.min_value = 0
    bar.max_value = 100
    bar.add_theme_stylebox_override("background", _bar_style(Color(PANEL_SOFT, 0.78)))
    bar.add_theme_stylebox_override("fill", _bar_style(PRIMARY))
    return bar


func _pill(value: String, color: Color) -> Label:
    var pill := _label(value, 23, color, true)
    pill.custom_minimum_size = Vector2(280, 58)
    pill.add_theme_stylebox_override("normal", _panel_style(Color(PANEL, 0.88), Color(color, 0.45), 24, 2))
    return pill


func _palette_button(index: int) -> Button:
    var palette: Dictionary = PALETTES[index]
    var selected := index == current_palette
    var button := Button.new()
    button.text = ("✓  " if selected else "") + str(palette.name)
    button.focus_mode = Control.FOCUS_NONE
    button.custom_minimum_size = Vector2(220, 72)
    button.add_theme_font_size_override("font_size", 24)
    button.add_theme_color_override("font_color", palette.ink)
    button.add_theme_color_override("font_pressed_color", palette.ink)
    button.add_theme_stylebox_override("normal", _panel_style(palette.primary, Color.WHITE if selected else palette.accent, 24, 4 if selected else 2))
    button.add_theme_stylebox_override("hover", _panel_style(palette.primary.lightened(0.06), Color.WHITE, 24, 4))
    button.add_theme_stylebox_override("pressed", _panel_style(palette.primary.darkened(0.08), Color.WHITE, 24, 4))
    button.pressed.connect(_select_palette.bind(index))
    return button


func _label(value: String, font_size: int, color: Color, bold := false) -> Label:
    var label := Label.new()
    label.text = value
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    label.autowrap_mode = TextServer.AUTOWRAP_OFF
    label.add_theme_font_size_override("font_size", font_size)
    label.add_theme_color_override("font_color", color)
    if bold:
        label.add_theme_constant_override("outline_size", 2)
        label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.34))
    return label


func _button(value: String, font_size: int, background: Color, foreground: Color) -> Button:
    var button := Button.new()
    button.text = value
    button.focus_mode = Control.FOCUS_NONE
    button.custom_minimum_size = Vector2(220, 88)
    button.add_theme_font_size_override("font_size", font_size)
    button.add_theme_color_override("font_color", foreground)
    button.add_theme_color_override("font_pressed_color", foreground.darkened(0.10))
    button.add_theme_stylebox_override("normal", _panel_style(background, Color(ACCENT, 0.48), 30, 3))
    button.add_theme_stylebox_override("hover", _panel_style(background.lightened(0.06), Color.WHITE, 30, 3))
    button.add_theme_stylebox_override("pressed", _panel_style(background.darkened(0.06), ACCENT, 30, 4))
    return button


func _round_button(value: String, font_size: int, action: Callable) -> Button:
    var button := _button(value, font_size, PANEL, PRIMARY)
    button.custom_minimum_size = Vector2(82, 82)
    button.pressed.connect(action)
    return button


func _panel_style(background: Color, border: Color, radius: int, border_width: int) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = background
    style.border_color = border
    style.set_border_width_all(border_width)
    style.set_corner_radius_all(radius)
    style.content_margin_left = 28
    style.content_margin_right = 28
    style.content_margin_top = 24
    style.content_margin_bottom = 24
    return style


func _bar_style(color: Color) -> StyleBoxFlat:
    var style := StyleBoxFlat.new()
    style.bg_color = color
    style.set_corner_radius_all(9)
    return style


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
    current_palette = clampi(int(config.get_value("player", "palette", 0)), 0, PALETTES.size() - 1)


func _save_progress() -> void:
    var config := ConfigFile.new()
    config.set_value("player", "level", current_level)
    config.set_value("player", "score", total_score)
    config.set_value("player", "return_streak", return_streak)
    config.set_value("player", "last_play_day", last_play_day)
    config.set_value("player", "palette", current_palette)
    config.save(SAVE_PATH)
