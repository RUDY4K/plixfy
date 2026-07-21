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
    var first_profile: Dictionary = game.get_level_profile_for_test(1)
    assert(first_profile.columns == 4 and first_profile.target == 8, "First level must be immediate and easy")

    var board := ArrowBoard.new()
    root.add_child(board)
    await process_frame
    for level in [1, 5, 10, 20]:
        var profile: Dictionary = game.get_level_profile_for_test(level)
        board.configure(profile.columns, profile.rows, profile.target, level * 104729)
        board.new_level()
        assert(board.get_remaining() == profile.target, "Board must generate the requested tile count")
        assert(board.has_free_move(), "Generated board must always start with a valid move")
        var safety := 0
        while board.get_remaining() > 0 and safety < 100:
            assert(board.solve_step_for_test(), "Every generated state must remain solvable")
            safety += 1
        assert(board.get_remaining() == 0, "Generated level must be fully solvable")
    print("MASAR_SMOKE_OK")
    quit(0)
