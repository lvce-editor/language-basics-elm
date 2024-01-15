decoder : Decoder Avatar
decoder =
    Decode.map Avatar (Decode.nullable Decode.string)
