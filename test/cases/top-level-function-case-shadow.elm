todoDecoder =
    Decode.succeed Todo

decode result =
    case result of
        Just todoDecoder ->
            todoDecoder input

        Nothing ->
            use todoDecoder
