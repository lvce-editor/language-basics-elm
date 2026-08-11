todoDecoder =
    Decode.succeed Todo

message =
    "let todoDecoder = fake -> todoDecoder"

{- let todoDecoder = fake -}
after =
    use todoDecoder
