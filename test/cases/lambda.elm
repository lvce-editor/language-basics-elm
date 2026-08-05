init = \_ ->
    ( { zone = Time.utc, now = Time.millisToPosix 0 }
    , Task.perform GotZone Time.here
    )

subscriptions = \_ -> Time.every 1000 Tick
