extends Control

const ArrowBoardScript = preload("res://scripts/arrow_board.gd")
const BACKGROUND: Texture2D = preload("res://assets/hegra.png")
const SAVE_PATH := "user://masar_progress.cfg"

const BG := Color("#061326")
const PANEL := Color("#0B1D35")
const PANEL_SOFT := Color("#112B48")
const GOLD := Color("#F0C568")
const GOLD_DARK := Color("#8B642F")
const TURQUOISE := Color("#75D8CD")
const TEXT := Color("#FFF7E7")
const MUTED := Color("#B8C6D8")

var content: Control
var current_level := 1
var total_score := 0
var last_score := 0
var last_combo := 0
var last_mistakes := 0
var return_streak := 1
var last_play_day := -1


func _ready() -> void:
    layout_direction = Control.LAYOUT_DIRECTION_RTL
    _load_progress()
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
    var background := TextureRect.new()
    background.texture = BACKGROUND
    background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
    background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    background.modulate = Color(0.28, 0.34, 0.44, 1.0)
    background.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(background)

    var shade := ColorRect.new()
    shade.color = Color(0.012, 0.035, 0.078, 0.80)
    shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(shade)

    var upper_glow := ColorRect.new()
    upper_glow.color = Color(0.19, 0.48, 0.50, 0.055)
    upper_glow.position = Vector2(0, 0)
    upper_glow.size = Vector2(1080, 420)
    upper_glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(upper_glow)


func _reset_content() -> MarginContainer:
    if is_instance_valid(content):
        content.queue_free()
    var margin := MarginContainer.new()
    margin.name = "ScreenContent"
    margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    margin.add_theme_constant_override("margin_left", 58)
    margin.add_theme_constant_override("margin_right", 58)
    margin.add_theme_constant_override("margin_top", 64)
    margin.add_theme_constant_override("margin_bottom", 64)
    margin.modulate.a = 0.0
    add_child(margin)
    content = margin
    var tween := create_tween()
    tween.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
    tween.tween_property(margin, "modulate:a", 1.0, 0.22)
    return margin


func _show_home() -> void:
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 24)
    margin.add_child(column)

    column.add_child(_label("مَسار", 98, GOLD, true))
    column.add_child(_label("صفِّ ذهنك… وافتح الطريق", 36, MUTED))

    var journey := HBoxContainer.new()
    journey.alignment = BoxContainer.ALIGNMENT_CENTER
    journey.add_theme_constant_override("separation", 18)
    column.add_child(journey)
    journey.add_child(_pill("رحلة %d" % _journey_number(), GOLD))
    journey.add_child(_pill("سلسلة العودة %d" % return_streak, TURQUOISE))

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 680)
    card.add_theme_stylebox_override("panel", _panel_style(Color(0.035, 0.09, 0.17, 0.96), Color(0.47, 0.35, 0.18, 0.85), 42, 3))
    column.add_child(card)
    var card_column := VBoxContainer.new()
    card_column.alignment = BoxContainer.ALIGNMENT_CENTER
    card_column.add_theme_constant_override("separation", 28)
    card.add_child(card_column)
    card_column.add_child(_label("المستوى %d" % current_level, 54, TEXT, true))
    card_column.add_child(_label("المس النقوش ذات الطريق المفتوح\nواصنع سلسلة انسياب كاملة", 34, MUTED))
    card_column.add_child(_journey_progress())
    var play := _button("ابدأ الرحلة", 46, GOLD, BG)
    play.custom_minimum_size = Vector2(0, 116)
    play.pressed.connect(_show_game)
    card_column.add_child(play)

    column.add_child(_label("%d  مجموع النور" % total_score, 32, TURQUOISE, true))
    column.add_child(_label("جلسات قصيرة  •  حركة هادئة  •  بلا عقوبة", 26, Color(MUTED, 0.82)))


func _show_game() -> void:
    var margin := _reset_content()
    margin.add_theme_constant_override("margin_top", 34)
    margin.add_theme_constant_override("margin_bottom", 44)
    var column := VBoxContainer.new()
    column.add_theme_constant_override("separation", 17)
    margin.add_child(column)

    var top := HBoxContainer.new()
    top.layout_direction = Control.LAYOUT_DIRECTION_LTR
    column.add_child(top)
    top.add_child(_round_button("×", 58, _show_home))
    var spacer := Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer)
    top.add_child(_label("المستوى %d" % current_level, 40, TEXT, true))
    var spacer_two := Control.new()
    spacer_two.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer_two)
    var score_label := _label("0  ◈", 32, TURQUOISE, true)
    score_label.custom_minimum_size.x = 180
    top.add_child(score_label)

    var status_label := _label("اختر نقشًا طريقه مفتوح", 28, MUTED)
    column.add_child(status_label)
    var progress := _progress_bar()
    column.add_child(progress)

    var board_frame := PanelContainer.new()
    board_frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
    board_frame.add_theme_stylebox_override("panel", _panel_style(Color(0, 0, 0, 0), Color(0, 0, 0, 0), 38, 0))
    column.add_child(board_frame)
    var board: ArrowBoard = ArrowBoardScript.new()
    board.name = "ArrowBoard"
    var profile := _level_profile(current_level)
    board.configure(profile.columns, profile.rows, profile.target, current_level * 104729)
    board.progress_changed.connect(func(remaining: int, total: int, combo: int, score: int) -> void:
        score_label.text = "%d  ◈" % score
        progress.value = float(total - remaining) / float(maxi(1, total)) * 100.0
        status_label.text = "باقي %d" % remaining
        if combo >= 3:
            status_label.text = "انسياب ×%d   •   باقي %d" % [combo, remaining]
    )
    board.blocked_tap.connect(func() -> void:
        status_label.text = "هذا المسار مغلق — اختر سهمًا آخر"
    )
    board.level_cleared.connect(func(score: int, best_combo: int) -> void:
        _complete_level(score, best_combo, board.get_mistakes())
    )
    board_frame.add_child(board)

    var hint := _button("أظهر مسارًا مفتوحًا", 28, PANEL_SOFT, GOLD)
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
    column.add_child(_label("انسياب رائع", 78, GOLD, true))

    var medal_count := 3 if last_mistakes == 0 else (2 if last_mistakes <= 2 else 1)
    var medal_text := ""
    for index in range(3):
        medal_text += "◆  " if index < medal_count else "◇  "
    column.add_child(_label(medal_text.strip_edges(), 64, TURQUOISE))

    var card := PanelContainer.new()
    card.custom_minimum_size = Vector2(0, 500)
    card.add_theme_stylebox_override("panel", _panel_style(PANEL, Color(0.47, 0.35, 0.18, 0.85), 40, 3))
    column.add_child(card)
    var stats := VBoxContainer.new()
    stats.alignment = BoxContainer.ALIGNMENT_CENTER
    stats.add_theme_constant_override("separation", 27)
    card.add_child(stats)
    stats.add_child(_label("+%d نور" % last_score, 56, TURQUOISE, true))
    stats.add_child(_label("أفضل انسياب ×%d" % last_combo, 38, TEXT))
    stats.add_child(_label(_result_message(medal_count), 30, MUTED))
    stats.add_child(_journey_progress())

    var next := _button("المستوى التالي", 44, TURQUOISE, BG)
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


func _journey_number() -> int:
    return int((current_level - 1) / 5) + 1


func _result_message(medals: int) -> String:
    if medals == 3:
        return "لمسة مثالية — حافظ على السلسلة"
    if medals == 2:
        return "قريب من المثالية — حاول جمع ثلاث ماسات"
    return "أكملت الطريق — الجولة القادمة ستكون أفضل"


func _journey_progress() -> VBoxContainer:
    var wrap := VBoxContainer.new()
    wrap.custom_minimum_size = Vector2(640, 72)
    wrap.add_theme_constant_override("separation", 8)
    var within := (current_level - 1) % 5
    wrap.add_child(_label("تقدّم الرحلة  %d من 5" % within, 24, MUTED))
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
    bar.add_theme_stylebox_override("background", _bar_style(Color(0.035, 0.09, 0.17, 0.86)))
    bar.add_theme_stylebox_override("fill", _bar_style(TURQUOISE))
    return bar


func _pill(value: String, color: Color) -> Label:
    var pill := _label(value, 25, color, true)
    pill.custom_minimum_size = Vector2(280, 62)
    pill.add_theme_stylebox_override("normal", _panel_style(Color(0.035, 0.09, 0.17, 0.90), Color(color, 0.46), 24, 2))
    return pill


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
        label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.42))
    return label


func _button(value: String, font_size: int, background: Color, foreground: Color) -> Button:
    var button := Button.new()
    button.text = value
    button.focus_mode = Control.FOCUS_NONE
    button.custom_minimum_size = Vector2(220, 88)
    button.add_theme_font_size_override("font_size", font_size)
    button.add_theme_color_override("font_color", foreground)
    button.add_theme_color_override("font_pressed_color", foreground.darkened(0.10))
    button.add_theme_stylebox_override("normal", _panel_style(background, Color(GOLD_DARK, 0.78), 30, 3))
    button.add_theme_stylebox_override("hover", _panel_style(background.lightened(0.06), GOLD, 30, 3))
    button.add_theme_stylebox_override("pressed", _panel_style(background.darkened(0.06), TURQUOISE, 30, 4))
    return button


func _round_button(value: String, font_size: int, action: Callable) -> Button:
    var button := _button(value, font_size, PANEL, GOLD)
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


func _save_progress() -> void:
    var config := ConfigFile.new()
    config.set_value("player", "level", current_level)
    config.set_value("player", "score", total_score)
    config.set_value("player", "return_streak", return_streak)
    config.set_value("player", "last_play_day", last_play_day)
    config.save(SAVE_PATH)
