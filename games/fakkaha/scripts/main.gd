extends Control

const PuzzleBoardScript = preload("res://scripts/puzzle_board.gd")
const SAVE_PATH := "user://progress.cfg"
const LEVELS := [
    {"name": "الحِجر", "texture": preload("res://assets/levels/hegra_01.png"), "grid": 3, "shuffle": 3, "rotations": 0},
    {"name": "الدرعية", "texture": preload("res://assets/levels/diriyah_02.png"), "grid": 3, "shuffle": 6, "rotations": 0},
    {"name": "جدة التاريخية", "texture": preload("res://assets/levels/jeddah_03.png"), "grid": 3, "shuffle": 10, "rotations": 1},
    {"name": "رجال ألمع", "texture": preload("res://assets/levels/rijal_almaa_04.png"), "grid": 3, "shuffle": 14, "rotations": 2},
    {"name": "جزر فرسان", "texture": preload("res://assets/levels/farasan_05.png"), "grid": 4, "shuffle": 8, "rotations": 0},
    {"name": "واحة الأحساء", "texture": preload("res://assets/levels/alahsa_06.png"), "grid": 4, "shuffle": 14, "rotations": 1},
    {"name": "حافة العالم", "texture": preload("res://assets/levels/edge_world_07.png"), "grid": 4, "shuffle": 22, "rotations": 2},
    {"name": "قصر المصمك", "texture": preload("res://assets/levels/masmak_08.png"), "grid": 4, "shuffle": 32, "rotations": 4},
    {"name": "ورد الطائف", "texture": preload("res://assets/levels/taif_09.png"), "grid": 4, "shuffle": 46, "rotations": 7},
    {"name": "جبال السودة", "texture": preload("res://assets/levels/soudah_10.png"), "grid": 4, "shuffle": 60, "rotations": 10},
]

const BG := Color("#071225")
const PANEL := Color("#0B1A32")
const PANEL_SOFT := Color("#102744")
const GOLD := Color("#E9B95C")
const GOLD_DARK := Color("#9B672A")
const TURQUOISE := Color("#1FD6D0")
const TEXT := Color("#FFF7E7")
const MUTED := Color("#B9C4D8")

var content: Control
var backdrop: TextureRect
var currency := 720
var current_level := 1
var selected_level := 0
var completed_level := 0
var last_reward := 120
var reward_doubled := false


func _ready() -> void:
    layout_direction = Control.LAYOUT_DIRECTION_RTL
    _load_progress()
    selected_level = clampi(current_level - 1, 0, LEVELS.size() - 1)
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
    background.texture = _level_texture(selected_level)
    background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
    background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    background.modulate = Color(0.45, 0.48, 0.58, 1.0)
    background.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(background)
    backdrop = background

    var shade := ColorRect.new()
    shade.color = Color(0.015, 0.035, 0.09, 0.72)
    shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
    add_child(shade)


func _reset_content() -> MarginContainer:
    if is_instance_valid(content):
        content.queue_free()
    var margin := MarginContainer.new()
    margin.name = "ScreenContent"
    margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    margin.add_theme_constant_override("margin_left", 70)
    margin.add_theme_constant_override("margin_right", 70)
    margin.add_theme_constant_override("margin_top", 80)
    margin.add_theme_constant_override("margin_bottom", 80)
    add_child(margin)
    content = margin
    return margin


func _show_home() -> void:
    _set_backdrop(_level_texture(selected_level))
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.add_theme_constant_override("separation", 32)
    margin.add_child(column)

    var top := HBoxContainer.new()
    top.layout_direction = Control.LAYOUT_DIRECTION_LTR
    column.add_child(top)
    top.add_child(_round_button("⚙", 64, func() -> void: pass))
    var top_spacer := Control.new()
    top_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(top_spacer)
    top.add_child(_currency_badge())

    var title := _label("فكّها", 108, GOLD, true)
    title.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.75))
    title.add_theme_constant_override("shadow_offset_x", 4)
    title.add_theme_constant_override("shadow_offset_y", 6)
    column.add_child(title)

    var subtitle := _label("ألغاز من قلب الحكاية العربية", 34, MUTED)
    column.add_child(subtitle)

    var card := PanelContainer.new()
    card.size_flags_vertical = Control.SIZE_SHRINK_CENTER
    card.add_theme_stylebox_override("panel", _panel_style(Color(0.035, 0.08, 0.16, 0.94), GOLD, 36, 5))
    column.add_child(card)

    var card_column := VBoxContainer.new()
    card_column.add_theme_constant_override("separation", 24)
    card.add_child(card_column)

    var daily := _label(LEVELS[selected_level].name, 50, GOLD, true)
    daily.add_theme_constant_override("outline_size", 8)
    daily.add_theme_color_override("font_outline_color", BG)
    card_column.add_child(daily)

    var preview_frame := PanelContainer.new()
    preview_frame.custom_minimum_size = Vector2(0, 610)
    preview_frame.add_theme_stylebox_override("panel", _panel_style(PANEL, TURQUOISE.darkened(0.2), 24, 4))
    card_column.add_child(preview_frame)
    var preview := TextureRect.new()
    preview.texture = _level_texture(selected_level)
    preview.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    preview.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
    preview_frame.add_child(preview)

    var progress := _label("المرحلة %d من %d" % [selected_level + 1, LEVELS.size()], 34, GOLD)
    card_column.add_child(progress)

    var play := _button("ابدأ", 52, GOLD, BG)
    play.custom_minimum_size.y = 126
    play.pressed.connect(_show_game)
    card_column.add_child(play)

    var chapters := HBoxContainer.new()
    chapters.alignment = BoxContainer.ALIGNMENT_CENTER
    chapters.add_theme_constant_override("separation", 22)
    column.add_child(chapters)
    var level_grid := GridContainer.new()
    level_grid.columns = 5
    level_grid.add_theme_constant_override("h_separation", 16)
    level_grid.add_theme_constant_override("v_separation", 14)
    chapters.add_child(level_grid)
    for index in range(LEVELS.size()):
        var unlocked := index < current_level
        var marker := _button(
            str(index + 1) if unlocked else "🔒",
            38,
            TURQUOISE if index == selected_level else PANEL,
            BG if index == selected_level else GOLD
        )
        marker.custom_minimum_size = Vector2(140, 74)
        marker.disabled = not unlocked
        marker.pressed.connect(_select_level.bind(index))
        level_grid.add_child(marker)

    var nav := HBoxContainer.new()
    nav.alignment = BoxContainer.ALIGNMENT_CENTER
    nav.add_theme_constant_override("separation", 40)
    column.add_child(nav)
    for item in ["⌖", "◇", "⚙"]:
        nav.add_child(_round_button(item, 42, func() -> void: pass))


func _show_game() -> void:
    _set_backdrop(_level_texture(selected_level))
    var margin := _reset_content()
    margin.add_theme_constant_override("margin_top", 46)
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 28)
    margin.add_child(column)

    var top := HBoxContainer.new()
    top.layout_direction = Control.LAYOUT_DIRECTION_LTR
    column.add_child(top)
    top.add_child(_round_button("×", 68, _show_home))
    var spacer := Control.new()
    spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer)
    top.add_child(_label("المستوى %d" % (selected_level + 1), 42, GOLD, true))
    var spacer_two := Control.new()
    spacer_two.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    top.add_child(spacer_two)
    var moves_label := _label("٠ حركة", 32, TEXT)
    moves_label.custom_minimum_size.x = 170
    top.add_child(moves_label)

    var guidance := "اضغط القطعة المضيئة لتحريكها نحو الفراغ"
    if selected_level == 1:
        guidance = "رتّب الصورة بتحريك القطع المجاورة نحو الفراغ"
    elif selected_level >= 2:
        guidance = "حرّك القطع، واضغط القطعة البعيدة لتدويرها"
    column.add_child(_label(LEVELS[selected_level].name + " — " + guidance, 28, MUTED))

    var board_frame := PanelContainer.new()
    board_frame.size_flags_vertical = Control.SIZE_SHRINK_CENTER
    board_frame.add_theme_stylebox_override("panel", _panel_style(Color(0.02, 0.05, 0.11, 0.94), GOLD_DARK, 30, 5))
    column.add_child(board_frame)

    var aspect := AspectRatioContainer.new()
    aspect.ratio = 1.0
    aspect.stretch_mode = AspectRatioContainer.STRETCH_FIT
    board_frame.add_child(aspect)
    var board: PuzzleBoard = PuzzleBoardScript.new()
    board.name = "PuzzleBoard"
    board.puzzle_texture = _level_texture(selected_level)
    board.grid_size = int(LEVELS[selected_level].grid)
    board.shuffle_steps = int(LEVELS[selected_level].shuffle)
    board.rotated_tile_count = int(LEVELS[selected_level].rotations)
    board.tutorial_enabled = selected_level == 0
    board.moves_changed.connect(func(value: int) -> void: moves_label.text = "%d حركة" % value)
    board.puzzle_solved.connect(_complete_level)
    aspect.add_child(board)

    var tools := HBoxContainer.new()
    tools.alignment = BoxContainer.ALIGNMENT_CENTER
    tools.add_theme_constant_override("separation", 24)
    column.add_child(tools)
    var hint := _button("💡 تلميح", 28, PANEL_SOFT, GOLD)
    hint.pressed.connect(board.use_hint)
    tools.add_child(hint)
    var shuffle := _button("↝ خلط", 28, PANEL_SOFT, TURQUOISE)
    shuffle.pressed.connect(board.reset_and_shuffle)
    tools.add_child(shuffle)
    var undo := _button("↶ تراجع", 28, PANEL_SOFT, TEXT)
    undo.pressed.connect(board.undo)
    tools.add_child(undo)


func _complete_level() -> void:
    completed_level = selected_level
    last_reward = 80 + (completed_level + 1) * 20
    reward_doubled = false
    currency += last_reward
    if completed_level + 1 >= current_level and current_level < LEVELS.size():
        current_level += 1
    selected_level = mini(completed_level + 1, LEVELS.size() - 1)
    _save_progress()
    _show_result()


func _show_result() -> void:
    _set_backdrop(_level_texture(completed_level))
    var margin := _reset_content()
    var column := VBoxContainer.new()
    column.alignment = BoxContainer.ALIGNMENT_CENTER
    column.add_theme_constant_override("separation", 24)
    margin.add_child(column)

    column.add_child(_label("أحسنت!", 96, GOLD, true))
    column.add_child(_label("★  ★  ☆", 76, GOLD))

    var art_frame := PanelContainer.new()
    art_frame.custom_minimum_size = Vector2(0, 820)
    art_frame.size_flags_vertical = Control.SIZE_EXPAND_FILL
    art_frame.add_theme_stylebox_override("panel", _panel_style(PANEL, GOLD, 30, 6))
    column.add_child(art_frame)
    var art := TextureRect.new()
    art.texture = _level_texture(completed_level)
    art.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
    art.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
    art_frame.add_child(art)

    var reward_label := _label("المكافأة %d ◈" % last_reward, 42, TURQUOISE, true)
    column.add_child(reward_label)

    var next := _button("التالي", 48, TURQUOISE, BG)
    next.custom_minimum_size.y = 112
    next.pressed.connect(_show_game if completed_level < LEVELS.size() - 1 else _show_home)
    column.add_child(next)

    var double_reward := _button("▶ ضاعف المكافأة", 32, PANEL_SOFT, GOLD)
    double_reward.custom_minimum_size.y = 90
    double_reward.pressed.connect(func() -> void:
        if reward_doubled:
            return
        reward_doubled = true
        currency += last_reward
        _save_progress()
        reward_label.text = "المكافأة %d ◈" % (last_reward * 2)
        double_reward.disabled = true
    )
    column.add_child(double_reward)


func _select_level(index: int) -> void:
    selected_level = clampi(index, 0, current_level - 1)
    _show_home()


func _level_texture(index: int) -> Texture2D:
    return LEVELS[clampi(index, 0, LEVELS.size() - 1)].texture


func _set_backdrop(texture: Texture2D) -> void:
    if is_instance_valid(backdrop):
        backdrop.texture = texture


func get_level_count() -> int:
    return LEVELS.size()


func _currency_badge() -> PanelContainer:
    var badge := PanelContainer.new()
    badge.add_theme_stylebox_override("panel", _panel_style(Color(0.03, 0.08, 0.15, 0.95), GOLD_DARK, 32, 4))
    var label := _label("◈  %d" % currency, 36, TURQUOISE, true)
    label.custom_minimum_size = Vector2(220, 76)
    badge.add_child(label)
    return badge


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
        label.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.45))
    return label


func _button(value: String, font_size: int, background: Color, foreground: Color) -> Button:
    var button := Button.new()
    button.text = value
    button.focus_mode = Control.FOCUS_ALL
    button.size_flags_vertical = Control.SIZE_SHRINK_CENTER
    button.custom_minimum_size = Vector2(210, 88)
    button.add_theme_font_size_override("font_size", font_size)
    button.add_theme_color_override("font_color", foreground)
    button.add_theme_color_override("font_hover_color", foreground.lightened(0.12))
    button.add_theme_color_override("font_pressed_color", foreground.darkened(0.12))
    button.add_theme_stylebox_override("normal", _panel_style(background, GOLD_DARK, 28, 3))
    button.add_theme_stylebox_override("hover", _panel_style(background.lightened(0.08), GOLD, 28, 4))
    button.add_theme_stylebox_override("pressed", _panel_style(background.darkened(0.08), TURQUOISE, 28, 4))
    button.add_theme_stylebox_override("disabled", _panel_style(background.darkened(0.35), Color(0.3, 0.3, 0.3), 28, 2))
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
    style.content_margin_left = 24
    style.content_margin_right = 24
    style.content_margin_top = 20
    style.content_margin_bottom = 20
    return style


func _load_progress() -> void:
    var config := ConfigFile.new()
    if config.load(SAVE_PATH) != OK:
        return
    currency = int(config.get_value("player", "currency", 720))
    current_level = clampi(int(config.get_value("player", "level", 1)), 1, LEVELS.size())


func _save_progress() -> void:
    var config := ConfigFile.new()
    config.set_value("player", "currency", currency)
    config.set_value("player", "level", current_level)
    config.save(SAVE_PATH)
