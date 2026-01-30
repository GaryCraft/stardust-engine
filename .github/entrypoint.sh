#!/bin/sh

#Splitting {{_ENV_STRING}}
line="${_ENV_STRING}"
arr=($line)
for i in "${arr[@]}"
do
  echo "Exporting Variable $i"
	export $i
done

# Replace Startup Variables
MODIFIED_STARTUP=$(echo -e ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')
echo ":/home/container$ ${MODIFIED_STARTUP}"

# Run the Server
eval ${MODIFIED_STARTUP}