# Analytics Events

The following list of events is fired through the analytics subsystem of challenge.

Each event is forwarded on the window DOM, prefixed with the `analytics.` string. As the first parameter in the event, a JSON object with the details about this event is passed.

Each analytics event has it's own particularities, as seen below:

# UI Events

## 1. `blur`
The user has moved away from the game interface.
```javascript
{
}
```

## 2. `focus`
The user has focused again in the game interface.
```javascript
{
}
```

# WebAPI Events

## 3. `webapi.error`
An error occurred in the WebAPI subsystem.
```javascript
{
    "error": "Error message"
}
```

## 4. `webapi.available`
The WebAPI was successfully installed and loaded by the user interface.
```javascript
{
}
```

## 5. `webapi.started`
The WebAPI has successfully opened a session to the challenge VM.
```javascript
{
}
```

# Virtual Machine Events

## 6. `vm.missing`
The Virtual Machine does not (yet) exist in the user's computer.
```javascript
{
}
```

## 7. `vm.available`
The Virtual Machine exists in the user's computer and is not yet started (Might never be fired).
```javascript
{
}
```

## 8. `vm.poweroff`
The Virtual Machine exists and is powered off.
```javascript
{
}
```

## 9. `vm.saved`
The Virtual Machine exists and is in saved state.
```javascript
{
}
```

## 10. `vm.paused`
The Virtual Machine exists and is paused.
```javascript
{
}
```

## 11. `vm.running`
The Virtual Machine exists and is running.
```javascript
{
}
```

## 12. `vm.booted`
The Virtual Machine has finished booting. This event is fired when the API port becomes available, that indirectly means that the VM is now running.

__NOTE:__ Due to the nature of the underlaying implementation this event might be fired more than once on the same session. You can safely ignore all other `vm.booted` events up until you receive a `vm.paused`, `vm.saved` or `vm.poweroff` event.
```javascript
{
}
```

# User Actions

## 13. `action.extern`
User clicked on an external link.
```javascript
{
    "id": "..",         // The short name of the target
    "url": "http:...",  // The URL of the link
}
```

Link `id` is one of the following:
<table>
    <tr>
        <th>Target</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>x-antimatter</code></td>
        <td>The antimatter experiment</td>
    </tr>
    <tr>
        <td><code>x-clicked</code></td>
        <td>The particle clicker.</td>
    </tr>
    <tr>
        <td><code>x-higgs</code></td>
        <td>The ATLAS higgs hunter.</td>
    </tr>
    <tr>
        <td><code>x-recognize</code></td>
        <td>The <em>Recognize This?</em> From CERN</td>
    </tr>
    <tr>
        <td><code>info-vm</code></td>
        <td>Wikipedia link to <em>Virtual Machine</em</td>
    </tr>
    <tr>
        <td><code>info-cernvm</code></td>
        <td>Link to the CernVM portal.</td>
    </tr>
    <tr>
        <td><code>info-lhc</code></td>
        <td>Link to the <em>Large Hadron Collider</em> details to the CERN portal.</td>
    </tr>
</table>

## 14. `actions.open_rdp`
The user clicked on the 'eye' button, that opens the VM console window.
```javascript
{
}
```

## 15. `actions.open_web`
The user clicked on the 'pop-out' button, that opens a new tab with the website of the application that runs inside the VM.
```javascript
{
}
```

## 16. `actions.remove`
The user clicked on the 'trash' button, that removes the VM from his/her computer.
```javascript
{
}
```

## 17. `actions.start`
The user clicked on the 'start' button, that starts the Virtual Machine.
```javascript
{
}
```

## 18. `actions.stop`
The user clicked on the 'stop' button, that stops and saves the state of the Virtual Machine.
```javascript
{
}
```

## 19. `actions.apply`
The user clicked on the 'apply' button, that applies the specified configuration to the Virtual Machine (memory, number of CPUs and execution cap).

__NOTE:__ This action will force the VM to reboot, so expect the vm.* events to be fired after this.
```javascript
{
    "cpus": 0,      // Number of CPUs
    "memory": 0,    // Amount of memory allocated (in MBytes)
    "cap": 100,     // The CPU execution cap in percentage
}
```

## 20. `actions.cap`
The user changed only the execution cap, that can be applied without rebooting the Virtual Machine. 
```javascript
{
    "cap": 100,     // The CPU execution cap in percentage
}
```

## 21. `actions.login`
The user has logged in with his/her social profile. This event is also fired when the social profile is restored from the configuration saved in the VM instance.
```javascript
{
    "userid": "...",    // CreditPiggy User ID
}
```

## 22. `actions.logout`
The user has logged out with his/her account.
```javascript
{
}
```

# Goals Tracking

## 23. `goals.cputime`
This event is fired every time the user has contributed one more hour of computing time.
```javascript
{
    "hours": 0,         // How many hours the user has contributed so far
}
```

## 24. `goals.jobs`
This event is fired every time the user has contributed 10 more jobs. This event doesn't take in account the exit code of the job. This means that this metric includes both failed and successful jobs.
```javascript
{
    "jobs": 0,         // How many jobs the user has completed so far
}
```

## 25. `goals.start`
This event is fired every time the user click 'start' on the user interface. 
```javascript
{
    "times": 0,         // How many times the user clicked 'start'
}
```

# Analytics Helpers

## 26. `link.trackids`
This event is fired when two tracking IDs are realized to be part of the same tracking session.
```javascript
{
    "trackid2": 0,      // The other tacking id
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


