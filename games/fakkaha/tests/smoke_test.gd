extends SceneTree


func _initialize() -> void:
    call_deferred("_run")


func _run() -> void:
    var packed: PackedScene = load("res://scenes/main.tscn")
    assert(packed != null, "Main scene must load")
    var game := packed.instantiate()
    root.add_child(game)
    await process_frame
    await process_frame
    assert(game.get_node_or_null("ScreenContent") != null, "Home screen should be created")

    var board := PuzzleBoard.new()
    board.puzzle_texture = load("res://assets/levels/hegra_01.png")
    root.add_child(board)
    await process_frame
    assert(board.get_tile_order().size() == 16, "Puzzle must have 16 board positions")
    assert(board.get_tile_order().count(-1) == 1, "Puzzle must have one empty position")
    var initial_order := board.get_tile_order()
    board.use_hint()
    assert(board.moves == 1, "Using a hint must count as one move")
    board.undo()
    assert(board.get_tile_order() == initial_order, "Undo must restore the board after a hint")
    print("FAKKAHA_SMOKE_OK")
    quit(0)
