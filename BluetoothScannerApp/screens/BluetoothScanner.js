import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import RNBluetoothClassic from 'react-native-bluetooth-classic';

const bleManager = new BleManager();

const CombinedBluetoothScanner = () => {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          alert('Required permissions not granted!');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const startScanning = () => {
    setScanning(true);
    setDevices([]);

    scanBLEDevices();
    scanClassicDevices();

    setTimeout(stopScanning, 15000);
  };

  const stopScanning = () => {
    bleManager.stopDeviceScan();
    setScanning(false);
    console.log('Scanning stopped.');
  };

  const scanBLEDevices = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('BLE Scan Error:', error);
        return;
      }

      if (device) {
        addUniqueDevice({ 
          id: device.id, 
          name: device.name || 'Unknown Device', 
          type: 'BLE' 
        });
      }
    });
  };

  const scanClassicDevices = async () => {
    try {
      const classicDevices = await RNBluetoothClassic.startDiscovery();
      console.log('Classic Devices Found:', classicDevices);

      classicDevices.forEach((device) => {
        addUniqueDevice({
          id: device.address, 
          name: device.name || 'Unknown Device', 
          type: 'Classic' 
        });
      });
    } catch (error) {
      console.error('Classic Bluetooth Scan Error:', error);
    }
  };

  const addUniqueDevice = (newDevice) => {
    setDevices((prevDevices) => {
      const deviceExists = prevDevices.some(device => device.id === newDevice.id);
      return deviceExists ? prevDevices : [...prevDevices, newDevice];
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.deviceContainer}>
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceType}>Type: {item.type}</Text>
      <Text>ID: {item.id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Button title={scanning ? 'Stop Scan' : 'Start Scan'} onPress={scanning ? stopScanning : startScanning} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.noDevices}>No devices found</Text>}
      />
    </View>
  );
};

export default CombinedBluetoothScanner;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  deviceContainer: { padding: 10, marginBottom: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
  deviceName: { fontSize: 18, fontWeight: 'bold' },
  deviceType: { fontSize: 14, color: '#555' },
  noDevices: { textAlign: 'center', marginTop: 20, color: '#888' },
});
