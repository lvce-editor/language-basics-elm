type Msg
    = Tick Time.Posix
    | AdjustTimeZone Time.Zone
    | ToggleTodo Int

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Tick posix ->
            model

        AdjustTimeZone newZone ->
            model

        ToggleTodo targetIndex ->
            model

subscriptions : Model -> Sub Msg
subscriptions _ =
    Time.every 1000 Tick
