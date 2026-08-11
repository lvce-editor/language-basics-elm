todoDecoder =
    Decode.succeed Todo

options =
    { todoDecoder = todoDecoder
    , fallback = todoDecoder
    }
