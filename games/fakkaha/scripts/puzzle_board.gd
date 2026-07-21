class_name PuzzleBoard
extends Control

signal moves_changed(value: int)
signal puzzle_solved

const GOLD := Color("#E9B95C")
const TURQUOISE := Color("#1FD6D0")
const BOARD_BG := Color("#071225")

@export var puzzle_texture: Texture2D
@export_range(3, 4, 1) var grid_size := 4
@export_range(1, 100, 1) var shuffle_steps := 24
@export_range(0, 15, 1) var rotated_tile_count := 0
@export var tutorial_enabled := false

var order: Array[int] = []
var rotations: Array[int] = []
var history: Array[Dictionary] = []
var moves := 0
var locked := false
var tutorial_position := -1
var feedback_position := -1
var feedback_alpha := 0.0:
    set(value):
        feedback_alpha = value
        queue_redraw()


func _ready() -> void:
    custom_minimum_size = Vector2(760, 760)
    mouse_filter = Control.MOUSE_FILTER_STOP
    resized.connect(queue_redraw)
    reset_and_shuffle()


func _process(_delta: float) -> void:
    if tutorial_position >= 0:
        queue_redraw()


func reset_and_shuffle() -> void:
    var tile_count := grid_size * grid_size
    order.clear()
    rotations.clear()
    history.clear()
    for index in range(tile_count - 1):
        order.append(index)
        rotations.append(0)
    order.append(-1)

    var previous_empty := -1
    for _step in range(shuffle_steps):
        var empty := order.find(-1)
        var neighbours := _neighbours(empty).filter(func(pos: int) -> bool: return pos != previous_empty)
        if neighbours.is_empty():
            neighbours = _neighbours(empty)
        var chosen: int = neighbours.pick_random()
        previous_empty = empty
        order[empty] = order[chosen]
        order[chosen] = -1

    var rotation_candidates: Array[int] = []
    for tile in range(tile_count - 1):
        rotation_candidates.append(tile)
    rotation_candidates.shuffle()
    for index in range(mini(rotated_tile_count, rotation_candidates.size())):
        var tile := rotation_candidates[index]
        rotations[tile] = randi_range(1, 3)

    if _is_solved():
        var empty := order.find(-1)
        var chosen: int = _neighbours(empty).front()
        order[empty] = order[chosen]
        order[chosen] = -1
        previous_empty = empty

    tutorial_position = previous_empty if tutorial_enabled else -1
    moves = 0
    locked = false
    moves_changed.emit(moves)
    queue_redraw()


func undo() -> void:
    if locked or history.is_empty():
        return
    var state: Dictionary = history.pop_back()
    order.assign(state.order)
    rotations.assign(state.rotations)
    moves = int(state.moves)
    moves_changed.emit(moves)
    _pulse(order.find(-1))
    Input.vibrate_handheld(20)


func use_hint() -> void:
    if locked:
        return
    tutorial_position = -1
    _remember_state()
    for tile in range(rotations.size()):
        if rotations[tile] != 0:
            rotations[tile] = 0
            _finish_action(order.find(tile))
            return

    for position in range(order.size()):
        var tile := order[position]
        if tile >= 0 and tile != position:
            var target := tile
            var other := order[target]
            order[target] = tile
            order[position] = other
            _finish_action(target)
            return


func get_tile_order() -> Array[int]:
    return order.duplicate()


func get_rotated_tile_count() -> int:
    var count := 0
    for rotation in rotations:
        if rotation != 0:
            count += 1
    return count


func _gui_input(event: InputEvent) -> void:
    if locked:
        return
    if event is InputEventScreenTouch and event.pressed:
        _press_at(event.position)
        accept_event()
    elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
        _press_at(event.position)
        accept_event()


func _press_at(point: Vector2) -> void:
    var board := _board_rect()
    if not board.has_point(point):
        return
    var local := point - board.position
    var tile_size := board.size.x / grid_size
    var column := clampi(int(local.x / tile_size), 0, grid_size - 1)
    var row := clampi(int(local.y / tile_size), 0, grid_size - 1)
    var position := row * grid_size + column
    if order[position] < 0:
        return

    tutorial_position = -1
    _remember_state()
    var empty := order.find(-1)
    if position in _neighbours(empty):
        order[empty] = order[position]
        order[position] = -1
        _finish_action(empty)
    else:
        var tile := order[position]
        rotations[tile] = (rotations[tile] + 1) % 4
        _finish_action(position)


func _remember_state() -> void:
    history.append({
        "order": order.duplicate(),
        "rotations": rotations.duplicate(),
        "moves": moves,
    })
    if history.size() > 60:
        history.pop_front()


func _finish_action(position: int) -> void:
    moves += 1
    moves_changed.emit(moves)
    _pulse(position)
    Input.vibrate_handheld(18)
    if _is_solved():
        locked = true
        Input.vibrate_handheld(80)
        await get_tree().create_timer(0.65).timeout
        puzzle_solved.emit()


func _pulse(position: int) -> void:
    feedback_position = position
    feedback_alpha = 0.9
    var tween := create_tween()
    tween.tween_property(self, "feedback_alpha", 0.0, 0.32)
    queue_redraw()


func _is_solved() -> bool:
    var tile_count := grid_size * grid_size
    if order.size() != tile_count or rotations.size() != tile_count - 1:
        return false
    for position in range(tile_count - 1):
        if order[position] != position or rotations[position] != 0:
            return false
    return order[tile_count - 1] == -1


func _neighbours(position: int) -> Array[int]:
    var result: Array[int] = []
    var row: int = position / grid_size
    var column := position % grid_size
    if row > 0:
        result.append(position - grid_size)
    if row < grid_size - 1:
        result.append(position + grid_size)
    if column > 0:
        result.append(position - 1)
    if column < grid_size - 1:
        result.append(position + 1)
    return result


func _board_rect() -> Rect2:
    var side := minf(size.x, size.y)
    return Rect2((size - Vector2(side, side)) * 0.5, Vector2(side, side))


func _draw() -> void:
    var board := _board_rect()
    draw_rect(board.grow(12), BOARD_BG, true)
    draw_rect(board.grow(12), GOLD.darkened(0.2), false, 6.0)
    if puzzle_texture == null:
        return

    var tile_size := board.size.x / grid_size
    var source_size := puzzle_texture.get_size() / grid_size
    var gap := 5.0

    for position in range(order.size()):
        var tile := order[position]
        if tile < 0:
            var blank_rect := Rect2(
                board.position + Vector2(position % grid_size, position / grid_size) * tile_size + Vector2(gap, gap),
                Vector2.ONE * (tile_size - gap * 2.0)
            )
            draw_rect(blank_rect, Color("#0B1930"), true)
            draw_circle(blank_rect.get_center(), 13.0, TURQUOISE.darkened(0.45))
            continue

        var destination := Rect2(
            board.position + Vector2(position % grid_size, position / grid_size) * tile_size + Vector2(gap, gap),
            Vector2.ONE * (tile_size - gap * 2.0)
        )
        var source := Rect2(
            Vector2(tile % grid_size, tile / grid_size) * source_size,
            source_size
        )
        var center := destination.get_center()
        draw_set_transform(center, rotations[tile] * PI * 0.5, Vector2.ONE)
        draw_texture_rect_region(
            puzzle_texture,
            Rect2(-destination.size * 0.5, destination.size),
            source
        )
        draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

        var correct := tile == position and rotations[tile] == 0
        draw_rect(destination, TURQUOISE if correct else GOLD, false, 4.0)
        if position == tutorial_position:
            var glow := 0.16 + (sin(Time.get_ticks_msec() * 0.006) + 1.0) * 0.09
            draw_rect(destination.grow(3), Color(0.12, 0.92, 0.88, glow), true)
            draw_rect(destination.grow(6), TURQUOISE, false, 10.0)
        if position == feedback_position and feedback_alpha > 0.0:
            draw_rect(destination.grow(5), Color(0.12, 0.84, 0.82, feedback_alpha), false, 8.0)
