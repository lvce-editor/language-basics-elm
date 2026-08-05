module Commands exposing (subscriptions, update)

update message model =
    case message of
        Increment ->
            ( { model | count = model.count + 1 }, Cmd.none )

subscriptions model =
    Sub.batch [ Time.every 1000 Tick ]
