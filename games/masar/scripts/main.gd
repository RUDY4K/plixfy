extends Control

const ArrowBoardScript = preload("res://scripts/arrow_board.gd")
const BACKGROUND: Texture2D = preload("res://assets/hegra.png")
const SAVE_PATH := "user://masar_progress.cfg"

const BG := Color("#071225")
const PANEL := Color("#0B1A32")
const PANEL_SOFT := Color("#102744")
const GOLD := Color("#E9B95C")
const GOLD_DARK := Color("#9B672A")
const TURQUOISE := Color("#1FD6D0")
const TEXT := Color("#FFF7E7")
const MUTED := Color("#B9C4D8")

var content: Control
var current_level := 1
var total_score := 0
var last_score := 0
var last_combo := 0


func _ready() -> void:
    layout_direction = Control.LAYOUT_DIRECTION_RTL
    _load_progress()
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
    var background := TextureRect.new()
    background.texture = BACKGROUND
    background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
    background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    background.modulate = Color(0.34, 0.38, 0.48, 1.0)
    background.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(background)

    var shade := ColorRect.new()
    shade.color = Color(0.015, 0.035, 0.09, 0.78)
    shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(shade)


func _reset_content() -> MarginContainer:
    if is_instance_valid(content):
        content.queue_free()
    var margin := MarginContainer.new()
    margin.name = "ScreenContent"
    margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    margin.add_theme_constant_override("margin_left", 64)
    margin.add_theme_constant_override("margin_right", 64)
    margin.add_theme_constant_override("margin_top", 70)
    margin.add_theme_constant_override("margin_bottom", 70)
    add_child(margin)
    content = margin
    return margin


func _show_home() -> void:
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 30)
    margin.add_child(column)

    column.add_child(_label("مَسار", 108, GOLD, true))
    column.add_child(_label("حرّر النقوش بلمسة واحدة", 38, MUTED))

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 760)
    card.add_theme_stylebox_override("panel", _panel_style(Color(0.035, 0.08, 0.16, 0.96), GOLD, 40, 5))
    column.add_child(card)
    var card_column := VBoxContainer.new()
    card_column.alignment = BoxContainer.ALIGNMENT_CENTER
    card_column.add_theme_constant_override("separation", 32)
    card.add_child(card_column)
    card_column.add_child(_label("المستوى %d" % current_level, 56, GOLD, true))
    card_column.add_child(_label("اضغط السهم الذي أمامه طريق مفتوح\nوشاهد اللوحة تنساب قطعةً قطعة", 34, TEXT))
    card_column.add_child(_label("لا مؤقت  •  لا عقوبة على اللمسة الخطأ", 28, TURQUOISE))
    var play := _button("ابدأ الانسياب", 48, GOLD, BG)
    play.custom_minimum_size = Vector2(0, 118)
    play.pressed.connect(_show_game)
    card_column.add_child(play)

    column.add_child(_label("مجموعك  %d  ◈" % total_score, 34, TURQUOISE, true))


func _show_game() -> void:
    var margin := _reset_content()
    margin.add_theme_constant_override("margin_top", 38)
    var column := VBoxContainer.new()
    column.add_theme_constant_override("separation", 22)
    margin.add_child(column)

    var top := HBoxContainer.new()
    top.layout_direction = Control.LAYOUT_DIRECTION_LTR
    column.add_child(top)
    top.add_child(_round_button("×", 60, _show_home))
    var spacer := Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer)
    top.add_child(_label("المستوى %d" % current_level, 42, GOLD, true))
    var spacer_two := Control.new()
    spacer_two.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer_two)
    var score_label := _label("0 ◈", 34, TURQUOISE, true)
    score_label.custom_minimum_size.x = 180
    top.add_child(score_label)

    var status_label := _label("اختر نقشًا طريقه مفتوح", 30, MUTED)
    column.add_child(status_label)

    var board_frame := PanelContainer.new()
    board_frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
    board_frame.add_theme_stylebox_override("panel", _panel_style(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 34, 0))
    column.add_child(board_frame)
    var board: ArrowBoard = ArrowBoardScript.new()
    board.name = "ArrowBoard"
    var profile := _level_profile(current_level)
    board.configure(profile.columns, profile.rows, profile.target, current_level * 104729)
    board.progress_changed.connect(func(remaining: int, total: int, combo: int, score: int) -> void:
        score_label.text = "%d ◈" % score
        status_label.text = "باقي %d من %d" % [remaining, total]
        if combo >= 3:
            status_label.text += "   •   انسياب ×%d" % combo
    )
    board.blocked_tap.connect(func() -> void:
        status_label.text = "المسار مغلق — جرّب سهمًا آخر"
    )
    board.level_cleared.connect(_complete_level)
    board_frame.add_child(board)

    var hint := _button("تلميح", 30, PANEL_SOFT, GOLD)
    hint.custom_minimum_size.y = 82
    hint.pressed.connect(board.show_hint)
    column.add_child(hint)


func _complete_level(score: int, best_combo: int) -> void:
    last_score = score
    last_combo = best_combo
    total_score += score
    current_level += 1
    _save_progress()
    _show_result()


func _show_result() -> void:
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 30)
    margin.add_child(column)
    column.add_child(_label("انسياب رائع!", 86, GOLD, true))
    column.add_child(_label("◆  ◆  ◆", 64, TURQUOISE))

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 520)
    card.add_theme_stylebox_override("panel", _panel_style(PANEL, GOLD, 38, 5))
    column.add_child(card)
    var stats := VBoxContainer.new()
    stats.alignment = BoxContainer.ALIGNMENT_CENTER
    stats.add_theme_constant_override("separation", 32)
    card.add_child(stats)
    stats.add_child(_label("+%d نقطة" % last_score, 58, TURQUOISE, true))
    stats.add_child(_label("أفضل انسياب ×%d" % last_combo, 40, TEXT))
    stats.add_child(_label("فُتح المستوى %d" % current_level, 34, MUTED))

    var next := _button("المستوى التالي", 46, TURQUOISE, BG)
    next.custom_minimum_size.y = 112
    next.pressed.connect(_show_game)
    column.add_child(next)


func _level_profile(level: int) -> Dictionary:
    var columns := mini(6, 4 + (level - 1) / 4)
    var rows := columns + 2
    var target := mini(26, mini(columns * rows - 2, 8 + (level - 1) * 2))
    return {"columns": columns, "rows": rows, "target": target}


func get_level_profile_for_test(level: int) -> Dictionary:
    return _level_profile(level)


func _label(value: String, font_size: int, color: Color, bold := false) -> Label:
    var label := Label.new()
    label.text = value
    label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    label.autowrap_mode = TextServer.AUTOWRAP_OFF
    label.add_theme_font_size_override("font_size", font_size)
    label.add_theme_color_override("font_color", color)
    if bold:
        label.add_theme_constant_override("outline_size", 3)
        label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.5))
    return label


func _button(value: String, font_size: int, background: Color, foreground: Color) -> Button:
    var button := Button.new()
    button.text = value
    button.focus_mode = Control.FOCUS_NONE
    button.custom_minimum_size = Vector2(220, 88)
    button.add_theme_font_size_override("font_size", font_size)
    button.add_theme_color_override("font_color", foreground)
    button.add_theme_color_override("font_pressed_color", foreground.darkened(0.12))
    button.add_theme_stylebox_override("normal", _panel_style(background, GOLD_DARK, 28, 3))
    button.add_theme_stylebox_override("hover", _panel_style(background.lightened(0.08), GOLD, 28, 4))
    button.add_theme_stylebox_override("pressed", _panel_style(background.darkened(0.08), TURQUOISE, 28, 4))
    return button


func _round_button(value: String, font_size: int, action: Callable) -> Button:
    var button := _button(value, font_size, PANEL, GOLD)
    button.custom_minimum_size = Vector2(84, 84)
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


func _load_progress() -> void:
    var config := ConfigFile.new()
    if config.load(SAVE_PATH) != OK:
        return
    current_level = maxi(1, int(config.get_value("player", "level", 1)))
    total_score = maxi(0, int(config.get_value("player", "score", 0)))


func _save_progress() -> void:
    var config := ConfigFile.new()
    config.set_value("player", "level", current_level)
    config.set_value("player", "score", total_score)
    config.save(SAVE_PATH)
