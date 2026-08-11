todoDecoder =
    Decode.succeed Todo

decode =
    List.map
        (\todoDecoder ->
            todoDecoder input
        )
        [ todoDecoder ]
