viewTodo todo =
    Html.li []
        [ Html.input
            [ Html.Attributes.type_ "checkbox"
            , Html.Attributes.checked todo.completed
            , Html.Events.onClick ToggleTodo
            ]
            []
        , Html.text todo.text
        ]
