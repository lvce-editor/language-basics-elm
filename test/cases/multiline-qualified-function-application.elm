module MultilineQualifiedFunctionApplication exposing (toggleTodo)

toggleTodo targetIndex model =
    { model
        | todos =
            List.indexedMap
                (\i todo ->
                    if i == targetIndex then
                        { todo | completed = not todo.completed }
                    else
                        todo
                )
                model.todos
    }
