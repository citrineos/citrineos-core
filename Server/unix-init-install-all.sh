#!/bin/bash

docker network create --driver=bridge citrine-network || echo "Network already exists."

execute_commands() {
    local commands=("$@")
    for cmd in "${commands[@]}"; do
        echo "Executing: $cmd"
        eval "$cmd"

        if [ $? -ne 0 ]; then
            echo "Error executing $cmd"
            exit 1
        fi
    done
}

# Commands for each module
base_commands=(
    "cd ../00_Base"
    "rm -rf ./lib"
    "rm -f citrineos-base-1.0.0.tgz"
    "npm install"
    "npm pack"
)

data_commands=(
    "cd ../01_Data"
    "rm -rf ./lib"
    "rm -f citrineos-data-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install"
    "npm pack"
)

util_commands=(
    "cd ../02_Util"
    "rm -rf ./lib"
    "rm -f citrineos-util-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install"
    "npm pack"
)

certificates_commands=(
    "cd ../03_Modules/Certificates"
    "rm -rf ./lib"
    "rm -f citrineos-certificates-1.0.0.tgz"
    "npm install ../../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../../02_Util/citrineos-util-1.0.0.tgz"
    "npm install"
    "npm pack"
)

configuration_commands=(
    "cd ../03_Modules/Configuration"
    "rm -rf ./lib"
    "rm -f citrineos-configuration-1.0.0.tgz"
    "npm install ../../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../../02_Util/citrineos-util-1.0.0.tgz"
    "npm install"
    "npm pack"
)

evdriver_commands=(
    "cd ../03_Modules/EVDriver"
    "rm -rf ./lib"
    "rm -f citrineos-evdriver-1.0.0.tgz"
    "npm install ../../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../../02_Util/citrineos-util-1.0.0.tgz"
    "npm install"
    "npm pack"
)

monitoring_commands=(
    "cd ../03_Modules/Monitoring"
    "rm -rf ./lib"
    "rm -f citrineos-monitoring-1.0.0.tgz"
    "npm install ../../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../../02_Util/citrineos-util-1.0.0.tgz"
    "npm install"
    "npm pack"
)

reporting_commands=(
    "cd ../03_Modules/Reporting"
    "rm -rf ./lib"
    "rm -f citrineos-reporting-1.0.0.tgz"
    "npm install ../../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../../02_Util/citrineos-util-1.0.0.tgz"
    "npm install"
    "npm pack"
)

smartcharging_commands=(
    "cd ../03_Modules/SmartCharging"
    "rm -rf ./lib"
    "rm -f citrineos-smartcharging-1.0.0.tgz"
    "npm install ../../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../../02_Util/citrineos-util-1.0.0.tgz"
    "npm install"
    "npm pack"
)

transactions_commands=(
    "cd ../03_Modules/Transactions"
    "rm -rf ./lib"
    "rm -f citrineos-transactions-1.0.0.tgz"
    "npm install ../../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../../02_Util/citrineos-util-1.0.0.tgz"
    "npm install"
    "npm pack"
)

ocpp_server_commands=(
    "cd ../Server"
    "rm -rf ./lib"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../01_Data/citrineos-data-1.0.0.tgz"
    "npm install ../02_Util/citrineos-util-1.0.0.tgz"
    "npm install ../03_Modules/Certificates/citrineos-certificates-1.0.0.tgz"
    "npm install ../03_Modules/Configuration/citrineos-configuration-1.0.0.tgz"
    "npm install ../03_Modules/EVDriver/citrineos-evdriver-1.0.0.tgz"
    "npm install ../03_Modules/Monitoring/citrineos-monitoring-1.0.0.tgz"
    "npm install ../03_Modules/Reporting/citrineos-reporting-1.0.0.tgz"
    "npm install ../03_Modules/SmartCharging/citrineos-smartcharging-1.0.0.tgz"
    "npm install ../03_Modules/Transactions/citrineos-transactions-1.0.0.tgz"
    "npm install"
)

# Execute commands for each module
execute_commands "${base_commands[@]}"
execute_commands "${data_commands[@]}"
execute_commands "${util_commands[@]}"
execute_commands "${certificates_commands[@]}"&
pid_certificates=$!
execute_commands "${configuration_commands[@]}"&
pid_configuration=$!
execute_commands "${evdriver_commands[@]}"&
pid_evdriver=$!
execute_commands "${monitoring_commands[@]}"&
pid_monitoring=$!
execute_commands "${reporting_commands[@]}"&
pid_reporting=$!
execute_commands "${smartcharging_commands[@]}"&
pid_smartcharging=$!
execute_commands "${transactions_commands[@]}"&
pid_transactions=$!



wait $pid_certificates
wait $pid_configuration
wait $pid_evdriver
wait $pid_monitoring
wait $pid_reporting
wait $pid_smartcharging
wait $pid_transactions

echo "Dependancy Installation Completed! Now initializing the OCPP server..."

execute_commands "${ocpp_server_commands[@]}"

echo "All commands executed successfully!"