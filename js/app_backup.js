async function loadBattery() {

    try {

        const res = await fetch("/api/battery");
        const data = await res.json();

        if (!data.online) {

            document.getElementById("status").innerHTML="OFFLINE";

            document.getElementById("statusLamp").className="w-2 h-2 rounded-full bg-red-500";

            return;
        }

        document.getElementById("status").innerHTML="ONLINE";

        document.getElementById("statusLamp").className="w-2 h-2 rounded-full bg-green-500";

        // CARD

        document.getElementById("battery_voltage").innerHTML =
            data.battery_voltage.toFixed(2)+" V";

        document.getElementById("soc_battery").innerHTML =
            data.soc+" %";

        document.getElementById("mode_battery").innerHTML =
            data.mode;

        document.getElementById("max_temp").innerHTML =
            data.max_temp+" °C";

        document.getElementById("min_temp").innerHTML =
            data.min_temp+" °C";

        document.getElementById("battery_current").innerHTML =
            data.battery_current.toFixed(2)+" A";

        document.getElementById("total_power").innerHTML =
            data.power.toFixed(2)+" W";

        document.getElementById("cycle_battery").innerHTML =
            data.discharge_times;

        document.getElementById("battery_level").style.height = `${data.soc}%`;

        if(data.soc<20){

            document.getElementById("battery_level").className =
            "battery-fill bg-red-500";

        }else if(data.soc<50){

            document.getElementById("battery_level").className =
            "battery-fill bg-yellow-500";

        }else{

            document.getElementById("battery_level").className =
            "battery-fill bg-green-500";

        }

        document.getElementById("battery_model").innerHTML =
            data.battery_model;

        document.getElementById("manufacture").innerHTML =
            data.manufacturer;

        document.getElementById("id_battery").innerHTML =
            data.slave;


        //SYSTEM INFO

        document.getElementById("last_update").innerHTML =
            data.time;

        // Card

        document.getElementById("socPercent").innerHTML =
            data.soc+" %";

        document.getElementById("socBar").style.width =
            data.soc+"%";

        if(data.soc<20){

            document.getElementById("socBar").className =
            "progress-bar bg-danger";

        }else if(data.soc<50){

            document.getElementById("socBar").className =
            "progress-bar bg-warning";

        }else{

            document.getElementById("socBar").className =
            "progress-bar bg-success";

        }

        document.getElementById("voltageCard").innerHTML =
            data.battery_voltage.toFixed(2)+" V";

        document.getElementById("currentCard").innerHTML =
            data.battery_current.toFixed(2)+" A";

        document.getElementById("powerCard").innerHTML =
            data.power.toFixed(2)+" W";

        document.getElementById("diffCell").innerHTML =
            data.diff_cell+" mV";

        document.getElementById("minCell").innerHTML =
            data.min_cell.toFixed(3)+" V";

        document.getElementById("maxCell").innerHTML =
            data.max_cell.toFixed(3)+" V";

        document.getElementById("maxTemp").innerHTML =
            data.max_temp+" °C";

        document.getElementById("minTemp").innerHTML =
            data.min_temp+" °C";

        document.getElementById("modeCard").innerHTML =
            data.mode;

        document.getElementById("cycle").innerHTML =
            data.discharge_times;

        document.getElementById("ah").innerHTML =
            data.discharge_ah+" Ah";

        document.getElementById("time").innerHTML =
            data.time;

        // Cell Voltage

        let html="";

        data.cell_voltage.forEach(function(v,i){

            html+=`

            <div class="col-lg-4 col-md-6">

                <div class="cellBox">

                    <div class="cellName">

                        Cell ${i+1}

                    </div>

                    <div class="cellVolt">

                        ${v.toFixed(3)} V

                    </div>

                </div>

            </div>

            `;

        });

        document.getElementById("cells").innerHTML=html;

        // Temperature

        html="";

        data.temperatures.forEach(function(v,i){

            html+=`

            <div class="col-lg-3 col-md-4">

                <div class="tempBox">

                    <div class="tempName">

                        T${i+1}

                    </div>

                    <div class="tempValue">

                        ${v} °C

                    </div>

                </div>

            </div>

            `;

        });

        document.getElementById("temps").innerHTML=html;

        // Alarm

        document.getElementById("critical1").innerHTML =
            data.critical_alarm1.join(" ");

        document.getElementById("critical2").innerHTML =
            data.critical_alarm2.join(" ");

        document.getElementById("major").innerHTML =
            data.major_alarm.join(" ");

        document.getElementById("minor").innerHTML =
            data.minor_alarm.join(" ");

    }

    catch(e){

        console.log(e);

    }

}

loadBattery();

setInterval(loadBattery,1000);