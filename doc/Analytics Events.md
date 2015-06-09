# Analytics Events

The following list of events is fired through the analytics subsystem of challenge.

Each event is forwarded on the window DOM, prefixed with the `analytics.` string. As the first parameter in the event, a JSON object with the details about this event is passed.

Each analytics event has it's own particularities, as seen below:

## blur
The user has moved away from the game interface.
```javascript
{
}
```

## focus
The user has focused again in the game interface.
```javascript
{
}
```

## login
The user has logged in with his/her social profile. This event is also fired when the social profile is restored from the configuration saved in the VM instance.
```javascript
{
    "userid": "...",    // SHA256([social profile ID])
}
```

## logout
The user has logged out with his/her account.
```javascript
{
}
```

## webapi.error
An error occurred in the WebAPI subsystem.
```javascript
{
    "error": "Error message"
}
```

## webapi.error
An error occurred in the WebAPI subsystem.
```javascript
{
    "error": "Error message"
}
```

## webapi.available
The WebAPI was successfully installed and loaded by the user interface.
```javascript
{
}
```

## webapi.started
The WebAPI has successfully opened a session to the challenge VM.
```javascript
{
}
```

## vm.missing
The Virtual Machine does not (yet) exist in the user's computer.
```javascript
{
}
```

## vm.available
The Virtual Machine exists in the user's computer and is not yet started (Might never be fired).
```javascript
{
}
```

## vm.poweroff
The Virtual Machine exists and is powered off.
```javascript
{
}
```

## vm.saved
The Virtual Machine exists and is in saved state.
```javascript
{
}
```

## vm.paused
The Virtual Machine exists and is paused.
```javascript
{
}
```

## vm.running
The Virtual Machine exists and is running.
```javascript
{
}
```

## vm.booter
The Virtual Machine has finished booting. This event is fired when the API port becomes available, that indirectly means that the VM is now running.

__NOTE:__ Due to the nature of the underlaying implementation this event might be fired more than once on the same session. You can safely ignore all other `vm.booted` events up until you receive a `vm.paused`, `vm.saved` or `vm.poweroff` event.
```javascript
{
    "provider": "", // The name of the login provider (ex. 'facebook')
}
```


## actions.open_rdp
The user clicked on the 'eye' button, that opens the VM console window.
```javascript
{
}
```

## actions.open_web
The user clicked on the 'pop-out' button, that opens a new tab with the website of the application that runs inside the VM.
```javascript
{
}
```

## actions.remove
The user clicked on the 'trash' button, that removes the VM from his/her computer.
```javascript
{
}
```

## actions.start
The user clicked on the 'start' button, that starts the Virtual Machine.
```javascript
{
}
```

## actions.stop
The user clicked on the 'stop' button, that stops and saves the state of the Virtual Machine.
```javascript
{
}
```

## actions.apply
The user clicked on the 'apply' button, that applies the specified configuration to the Virtual Machine (memory, number of CPUs and execution cap).

__NOTE:__ This action will force the VM to reboot, so expect the vm.* events to be fired after this.
```javascript
{
    "cpus": 0,      // Number of CPUs
    "memory": 0,    // Amount of memory allocated (in MBytes)
    "cap": 100,     // The CPU execution cap in percentage
}
```

## actions.cap
The user changed only the execution cap, that can be applied without rebooting the Virtual Machine. 
```javascript
{
    "cap": 100,     // The CPU execution cap in percentage
}
```

## actions.login
The user logged in with his/her social profile. This event is fired only to provide more information regarding the social source.
```javascript
{
    "provider": "", // The name of the login provider (ex. 'facebook')
}
```

# Deprecated or under deprecation
The following events were used on the first challenge and might not be re-used as-is for this one. So they might not have to be implemented in the GA-side.

## vm.collisions
There was an indication that the VM started to produce collisions.

__NOTE:__ This event is extracted by parsing the job log files and might not be always reliable. In addition, it is linked to the `vm.booted` event, since the parsing of the log files begins only when a positive `vm.booted` event is fired.
```javascript
{
}
```


