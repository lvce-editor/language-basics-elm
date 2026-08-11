todoDecoder : Decoder Todo
todoDecoder =
    Decode.succeed Todo

request =
    Http.expectJson GotTodo todoDecoder

decoders =
    [ todoDecoder, todoDecoder ]
