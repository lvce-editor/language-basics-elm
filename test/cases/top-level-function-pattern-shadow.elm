todoDecoder =
    Decode.succeed Todo

decode result =
    case result of
        { todoDecoder } ->
            todoDecoder input

        _ ->
            use todoDecoder
