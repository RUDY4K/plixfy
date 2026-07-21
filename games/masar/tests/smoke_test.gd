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
    assert(game.get_node_or_null("AbstractBackdrop") != null, "Abstract background should be created")
    assert(game.get_palette_count_for_test() == 3, "Three selectable palettes should be available")
    assert(game.get_analytics_path_for_test().begins_with("user://"), "Development analytics must stay local")
    var first_profile: Dictionary = game.get_level_profile_for_test(1)
    assert(first_profile.columns == 4 and first_profile.target == 6, "First level must be immediate and easy")
    assert(game.get_level_profile_for_test(4).target == 12, "The opening journey must rise gently")
    assert(game.get_level_profile_for_test(5).target == 18, "Later journeys must feel substantially fuller")
    var daily_a: Dictionary = game.get_daily_profile_for_test(20500)
    var daily_b: Dictionary = game.get_daily_profile_for_test(20500)
    var daily_next: Dictionary = game.get_daily_profile_for_test(20501)
    assert(daily_a == daily_b, "The daily puzzle must be identical for every player on the same UTC day")
    assert(daily_a.target == 24, "The daily puzzle must have competitive density")
    assert(daily_a.seed != daily_next.seed, "The daily puzzle must change on the next UTC day")
    assert(game.calculate_daily_score(20000, 0, 0) > game.calculate_daily_score(20000, 1, 0), "Mistakes must reduce the daily score")
    assert(game.calculate_daily_score(10000, 0, 0) > game.calculate_daily_score(20000, 0, 0), "Faster clean runs must score higher")

    var board := ArrowBoard.new()
    root.add_child(board)
    await process_frame
    for level in [1, 5, 10, 20]:
        var profile: Dictionary = game.get_level_profile_for_test(level)
        board.configure(profile.columns, profile.rows, profile.target, level * 104729)
        board.new_level()
        assert(board.get_remaining() == profile.target, "Board must generate the requested tile count")
        assert(board.has_free_move(), "Generated board must always start with a valid move")
        if level == 1:
            board.show_hint()
            assert(board.get_hints_used() == 1, "Hint usage must be tracked for competitive scoring")
        var safety := 0
        while board.get_remaining() > 0 and safety < 100:
            assert(board.solve_step_for_test(), "Every generated state must remain solvable")
            safety += 1
        assert(board.get_remaining() == 0, "Generated level must be fully solvable")
    print("MASAR_SMOKE_OK")
    quit(0)
