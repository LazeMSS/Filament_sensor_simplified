$(function () {
    function filamentsensorsimplifiedViewModel(parameters) {
        var self = this;

        self.validPinsBoard = [3,5,7,11,13,15,19,21,23,27,29,31,33,35,37,8,10,12,16,18,22,24,26,28,32,36,38,40];
        self.settingsViewModel = parameters[0];
        self.testSensorResult = ko.observable(null);
        self.gpio_mode_disabled = ko.observable(false);
        self.printing = ko.observable(false);
        self.gpio_mode_disabled_by_3rd = ko.computed(function() {
            return this.gpio_mode_disabled() && !this.printing();
        }, this);

        self.onDataUpdaterPluginMessage = function (plugin, data) {
            if (plugin !== "filamentsensorsimplified") {
                return;
            }

            new PNotify({
                title: 'Filament sensor simplified',
                text: data.msg,
                type: data.type,
                hide: data.autoClose
            });

        }

        self.testSensor = function () {
            // Cleanup
            $("#filamentsensorsimplified_settings_testResult").removeClass("text-warning text-error text-info text-success");
            // Make api callback
            $.ajax({
                    url: "/api/plugin/filamentsensorsimplified",
                    type: "post",
                    dataType: "json",
                    contentType: "application/json",
                    headers: {"X-Api-Key": UI_API_KEY},
                    data: JSON.stringify({
                        "command": "testSensor",
                        "pin": $("#filamentsensorsimplified_settings_pinInput").val(),
                        "power": $("#filamentsensorsimplified_settings_powerInput").val(),
                        "mode": $("#filamentsensorsimplified_settings_gpioMode").val(),
                        "triggered": $("#filamentsensorsimplified_settings_triggeredInput").val()
                    }),
                    statusCode: {
                        500: function () {
                            $("#filamentsensorsimplified_settings_testResult").addClass("text-error");
                            self.testSensorResult('<i class="fas fa-exclamation-triangle"></i> OctoPrint experienced issue. Check octoprint.log for further info');
                        },
                        555: function () {
                            $("#filamentsensorsimplified_settings_testResult").addClass("text-error");
                            self.testSensorResult('<i class="fas fa-exclamation-triangle"></i> This pin is currently used by others, choose other pin');
                        },
                        556: function () {
                            $("#filamentsensorsimplified_settings_testResult").addClass("text-error");
                            self.testSensorResult('<i class="fas fa-exclamation-triangle"></i> That is power, ground or out of range pin, choose other pin');
                        }
                    },
                    error: function () {
                        $("#filamentsensorsimplified_settings_testResult").addClass("text-error");
                        self.testSensorResult('<i class="fas fa-exclamation-triangle"></i> There was an error :(');
                    },
                    success: function (result) {
                        if (result.triggered === true) {
                            $("#filamentsensorsimplified_settings_testResult").addClass("text-success");
                            self.testSensorResult('<i class="fas fa-toggle-on"></i> Sensor detected filament!');
                        } else {
                            $("#filamentsensorsimplified_settings_testResult").addClass("text-info");
                            self.testSensorResult('<i class="fas fa-toggle-off"></i> Sensor triggered!')
                        }
                    }
                }
            );
        }
        self.checkWarningPullUp = function(event){
            var mode = parseInt($('#filamentsensorsimplified_settings_gpioMode').val(),10);
            var pin = parseInt($('#filamentsensorsimplified_settings_pinInput').val(),10);
            var sencon = parseInt($('#filamentsensorsimplified_settings_powerInput').val(),10);

            // Show alerts
            if (
                sencon == 1 && (
                    (mode == 10 && (pin==3 || pin == 5))
                    ||
                    (mode == 11 && (pin == 2 || pin == 3))
                )
            ){
                $('#filamentsensorsimplified_settings_pullupwarn').removeClass('hidden pulsAlert').addClass('pulsAlert');
            }else{
                $('#filamentsensorsimplified_settings_pullupwarn').addClass('hidden').removeClass('pulsAlert');
            }

            // Set max to right board type - 10 = Boardmode
            var warnactive = false;
            if (mode == 10){
                $('#filamentsensorsimplified_settings_pinInput').attr('max',40);
                if (pin != 0 && $.inArray(pin,self.validPinsBoard) == -1){
                    warnactive = true;
                    $('#filamentsensorsimplified_settings_badpin').removeClass('hidden pulsAlert').addClass('pulsAlert');
                }else{
                    $('#filamentsensorsimplified_settings_badpin').addClass('hidden').removeClass('pulsAlert');
                }
            }else{
                $('#filamentsensorsimplified_settings_pinInput').attr('max',27);
            }

            // High or low
            if ($('#filamentsensorsimplified_settings_pinInput').attr('max') < pin || pin < 0){
                $('#filamentsensorsimplified_settings_badpin').removeClass('hidden pulsAlert').addClass('pulsAlert');
            }else{
                if (!warnactive){
                    $('#filamentsensorsimplified_settings_badpin').addClass('hidden').removeClass('pulsAlert');
                }
            }
        }

        self.getDisabled = function (item) {
            $.ajax({
                type: "GET",
                dataType: "json",
                url: "plugin/filamentsensorsimplified/disable",
                success: function (result) {
                    self.gpio_mode_disabled(result.gpio_mode_disabled)
                    self.printing(result.printing)
                }
            });
        };

        self.onSettingsShown = function () {
            self.testSensorResult("");
            self.getDisabled();
             // Check for broken settings
            $('#filamentsensorsimplified_settings_gpioMode, #filamentsensorsimplified_settings_pinInput, #filamentsensorsimplified_settings_powerInput').off('change.fsensor').on('change.fsensor',self.checkWarningPullUp);
            $('#filamentsensorsimplified_settings_gpioMode').trigger('change.fsensor');
        }
    }

    // This is how our plugin registers itself with the application, by adding some configuration
    // information to the global variable OCTOPRINT_VIEWMODELS
    ADDITIONAL_VIEWMODELS.push({
        construct: filamentsensorsimplifiedViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_filamentsensorsimplified"]
    })
})
