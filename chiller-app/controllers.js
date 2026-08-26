window.CHILLER_CONTROLLERS = {
  "Trane": {
    families: {
      "Tracer AdaptiView (CenTraVac)": {
        verified: true,
        source: "Trane CTV-SVU01F-EN, Tracer AdaptiView Display for CenTraVac Water-Cooled Chillers",
        tasks: {
          status: [
            "From the main chiller screen, review the live status tiles before changing anything.",
            "Record evaporator entering/leaving water temperature, condenser entering/leaving water temperature, compressor status, average motor current %RLA, oil differential pressure, water-flow status, active chilled-water setpoint, and current setpoint source.",
            "Use Reports when you need a larger group of operating values or a repeatable log sheet."
          ],
          alarms: [
            "Touch Alarms in the bottom main-menu bar.",
            "The screen opens on Active Alarms, with the newest alarm at the top.",
            "Touch Historic Alarms to review resolved events, or All Alarms to combine active alarms with recent history.",
            "Record the exact alarm description, time, severity, and whether it repeats before pressing Reset Alarms.",
            "Only use Reset Alarms after the cause has been corrected; a persisting latching condition will return to the active list."
          ],
          setpoint: [
            "Touch Settings in the bottom main-menu bar.",
            "Open Chiller Settings for chilled-water control and setpoint-source items.",
            "Confirm the active setpoint source before changing a local value; BAS, external/front-panel, or other arbitration may be controlling the machine.",
            "Record the original value before changing any operator-level setpoint."
          ],
          sensor: [
            "Use the main status screen and Reports to identify the controller value for the sensor you are checking.",
            "Compare the displayed value to an independent calibrated instrument at the same physical location.",
            "If the value is wrong, prove wiring and the sensor element before applying any offset or replacement."
          ],
          bind: [
            "Do not assume a replacement sensor requires field binding. First identify the exact UC800/input module and sensor type from the chiller wiring diagram.",
            "Record the original input name, connector/terminal, and displayed value before disconnecting the sensor.",
            "Install only the specified sensor type and verify the controller value against an independent instrument.",
            "If configuration or input assignment is required, stop and match the exact CenTraVac model/controller service literature before writing configuration values."
          ],
          service: [
            "Open Settings and identify the available service-level pages for this controller revision.",
            "Record current settings before entering any manual-control or service function.",
            "Do not use manual controls or alter protection limits simply to force the chiller to run."
          ]
        }
      }
    }
  },
  "York / JCI": {
    families: {
      "OptiView (YMC2/YK family)": {
        verified: true,
        source: "Johnson Controls YORK OptiView operation guides, including 160.78-O2 and current YK/YMC2 OptiView literature",
        tasks: {
          status: [
            "Begin at the Home screen and record system status, control source, access level, leaving chilled-liquid temperature, active setpoint, compressor/load information, and condenser conditions before making changes.",
            "Use the dedicated Evaporator, Condenser, Compressor, Motor/VSD, Oil, and related component screens to drill into live values for the system you are diagnosing.",
            "If a value looks wrong, compare it to an independent field measurement before treating it as a real refrigeration or water-side problem."
          ],
          alarms: [
            "From the Home screen, open the warnings/safety/alarm area for the exact OptiView revision and record the full shutdown or warning message before clearing it.",
            "Review the event/history information for repeated shutdowns and the operating condition surrounding the event.",
            "Do not clear a shutdown until you have recorded the message and corrected the underlying condition."
          ],
          setpoint: [
            "From the Home screen, open the screen containing the required setpoint (commonly Evaporator or Setpoints for leaving chilled-liquid temperature).",
            "Press the setpoint button. The dialog shows the present value and allowed range.",
            "If the panel is at View access, use the displayed access prompt and log in with the authorized site access level before attempting a change.",
            "Enter or select the new value and confirm with Enter; record the original value first and verify the control source is not remote/BAS."
          ],
          sensor: [
            "Open the component screen associated with the sensor: Evaporator, Condenser, Oil, Compressor, Motor/VSD, or another applicable screen.",
            "Record the controller value and compare it with a calibrated field instrument at the same location.",
            "Use the exact model wiring diagram and I/O documentation to identify the input before disconnecting or replacing anything."
          ],
          bind: [
            "Identify the exact OptiView generation, chiller model, sensor part number, and I/O board/input before replacement.",
            "Record the existing input assignment and displayed value.",
            "Replace with the exact specified sensing device; connector fit alone does not prove compatibility.",
            "If the replacement requires setup, calibration, or assignment, use the model-specific service procedure and authorized access level; do not guess at service values.",
            "Verify the final displayed reading against an independent instrument and confirm related alarms remain cleared."
          ],
          service: [
            "From Home, use the authorized Login function when a higher access level is required.",
            "Navigate only to the model-specific service/diagnostic screen needed for the test.",
            "Record original settings before any service-level change and restore any temporary test command when complete."
          ]
        }
      }
    }
  },
  "Carrier": {families:{}},
  "Daikin / McQuay": {families:{}},
  "Multistack": {families:{}},
  "Smardt": {families:{}},
  "Other / Unknown": {families:{}}
};
