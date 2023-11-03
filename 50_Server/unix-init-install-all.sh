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
    "cd 00_Base"
    "rm -rf ./lib"
    "rm -f citrineos-base-1.0.0.tgz"
    "npm install"
    "npm pack"
)

util_commands=(
    "cd ../99_Util"
    "rm -rf ./lib"
    "rm -f citrineos-util-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install"
    "npm pack"
)

data_commands=(
    "cd ../10_Data"
    "rm -rf ./lib"
    "rm -f citrineos-data-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install"
    "npm pack"
)

provisioning_commands=(
    "cd ../01_Provisioning"
    "rm -rf ./lib"
    "rm -f citrineos-provisioning-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../99_Util/citrineos-util-1.0.0.tgz"
    "npm install ../10_Data/citrineos-data-1.0.0.tgz"
    "npm install"
    "npm pack"
)

authorization_commands=(
    "cd ../02_Authorization"
    "rm -rf ./lib"
    "rm -f citrineos-authorization-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../99_Util/citrineos-util-1.0.0.tgz"
    "npm install ../10_Data/citrineos-data-1.0.0.tgz"
    "npm install"
    "npm pack"
)

availability_commands=(
    "cd ../03_Availability"
    "rm -rf ./lib"
    "rm -f citrineos-availability-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../99_Util/citrineos-util-1.0.0.tgz"
    "npm install ../10_Data/citrineos-data-1.0.0.tgz"
    "npm install"
    "npm pack"
)

transaction_commands=(
    "cd ../04_Transaction"
    "rm -rf ./lib"
    "rm -f citrineos-transaction-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../99_Util/citrineos-util-1.0.0.tgz"
    "npm install ../10_Data/citrineos-data-1.0.0.tgz"
    "npm install"
    "npm pack"
)

monitoring_commands=(
    "cd ../05_Monitoring"
    "rm -rf ./lib"
    "rm -f citrineos-monitoring-1.0.0.tgz"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../99_Util/citrineos-util-1.0.0.tgz"
    "npm install ../10_Data/citrineos-data-1.0.0.tgz"
    "npm install"
    "npm pack"
)

ocpp_server_commands=(
    "cd ../50_Server"
    "rm -rf ./lib"
    "npm install ../00_Base/citrineos-base-1.0.0.tgz"
    "npm install ../99_Util/citrineos-util-1.0.0.tgz"
    "npm install ../10_Data/citrineos-data-1.0.0.tgz"
    "npm install ../01_Provisioning/citrineos-provisioning-1.0.0.tgz"
    "npm install ../02_Authorization/citrineos-authorization-1.0.0.tgz"
    "npm install ../03_Availability/citrineos-availability-1.0.0.tgz"
    "npm install ../04_Transaction/citrineos-transaction-1.0.0.tgz"
    "npm install ../05_Monitoring/citrineos-monitoring-1.0.0.tgz"
    "npm install"
)

cd ..
# Execute commands for each module
execute_commands "${base_commands[@]}"
execute_commands "${util_commands[@]}"
execute_commands "${data_commands[@]}"
execute_commands "${provisioning_commands[@]}"&
pid_provisioning=$!
execute_commands "${authorization_commands[@]}"&
pid_authorization=$!
execute_commands "${availability_commands[@]}"&
pid_availability=$!
execute_commands "${transaction_commands[@]}"&
pid_transaction=$!
execute_commands "${monitoring_commands[@]}"&
pid_monitoring=$!



wait $pid_provisioning
wait $pid_authorization
wait $pid_availability
wait $pid_transaction
wait $pid_monitoring

echo "Dependancy Installation Completed! Now initializing the OCPP server..."

execute_commands "${ocpp_server_commands[@]}"

echo "All commands executed successfully!"