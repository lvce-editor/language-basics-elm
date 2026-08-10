module ComparisonVariables exposing (update)

update msg =
    case msg of
        ToggleTodo targetIndex ->
            List.indexedMap
                (\i todo ->
                    if i == targetIndex then
                        todo
                    else
                        todo
                )
