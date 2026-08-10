module FunctionApplications exposing (view)

view model =
    div [ class "clock" ]
        [ text (String.fromInt model.count)
        , button [ onClick Increment ] [ text "+" ]
        ]

format model =
    model.count
        |> String.fromInt

countRemaining todos =
    todos
        |> List.length
