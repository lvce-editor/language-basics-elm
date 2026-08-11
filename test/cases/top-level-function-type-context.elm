todoDecoder =
    Decode.succeed Todo

type alias Config =
    { todoDecoder : String }

identity : todoDecoder -> todoDecoder
identity value =
    value

after =
    use todoDecoder
