import { router } from 'expo-router';

import { furSwatches } from '@/lib/dogs-store';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RED = '#c92e45';
const dogs = [
  { name: 'Mochi', fur: 'Tan and white', place: 'Library lawn', color: '#f7e6da' },
  { name: 'Luna', fur: 'Golden', place: 'Benson Center', color: '#f4e8d2' },
  { name: 'Pepper', fur: 'Black and white', place: 'Mission Gardens', color: '#e9edf0' },
];

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const matches = useMemo(() => dogs.filter(d => d.name.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  const visible = showAll || query ? matches : matches.slice(0, 1);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Hi, Alex</Text>
        <Text style={styles.subtitle}>A little more tail-wagging today.</Text>
        <View style={styles.search}><Text style={styles.searchIcon}>⌕</Text><TextInput style={styles.input} value={query} onChangeText={setQuery} placeholder="Search dogs by name" placeholderTextColor="#969095" accessibilityLabel="Search dogs by name" /><Pressable onPress={() => Alert.alert('Photo search', 'Photo search is coming soon.')}><Text style={styles.camera}>▣</Text></Pressable></View>
        <View style={styles.activity}>
          <View style={styles.activityHeader}><Text style={styles.sectionSmall}>Campus activity</Text><Text style={styles.muted}>6 active walks · sample data</Text></View>
          <View style={styles.map}>
            <View style={[styles.road, { top: 21, left: -15, width: 280, transform: [{rotate: '-7deg'}] }]} />
            <View style={[styles.road, { top: 76, left: -20, width: 290, transform: [{rotate: '4deg'}] }]} />
            <View style={[styles.road, { top: -10, left: 157, width: 200, transform: [{rotate: '72deg'}] }]} />
            <View style={[styles.grass, {top: 43, left: 24}]} /><View style={[styles.grass, {top: 66, left: 108}]} /><View style={[styles.grass, {top: 18, left: 130}]} />
            <View style={[styles.mapLabel, {top: 15, left: 48}]}><Text style={styles.mapLabelText}>Mission Church</Text></View>
            <View style={[styles.mapLabel, {top: 51, left: 62}]}><Text style={styles.mapLabelText}>Library</Text></View>
            <View style={[styles.pin, {top: 35, left: 80}]}><Text style={styles.pinText}>3</Text></View>
            <View style={[styles.pin, {top: 61, left: 169}]}><Text style={styles.pinText}>2</Text></View>
            <View style={[styles.pin, {top: 83, left: 108}]}><Text style={styles.pinText}>1</Text></View>
          </View>
          <Pressable style={styles.mapFooter} onPress={() => Alert.alert('Campus activity', '6 active walks around campus (sample data).')}><View><Text style={styles.mapBold}>Updates every 3 minutes</Text><Text style={styles.muted}>Last updated 2 minutes ago</Text><Text style={styles.muted}>Approximate areas only</Text></View><Text style={styles.arrow}>›</Text></Pressable>
        </View>
        <View style={styles.titleRow}><Text style={styles.sectionTitle}>Campus favorites</Text><Pressable onPress={() => setShowAll(v => !v)}><Text style={styles.link}>{showAll ? 'Show less' : 'See all'}</Text></Pressable></View>
        {visible.length ? visible.map(d => <Pressable key={d.name} style={styles.dogCard} onPress={() => router.push({ pathname: '/explore', params: { q: d.name } })}><View style={[styles.dogImage, {backgroundColor:d.color}]}></View><View style={styles.dogInfo}><Text style={styles.dogName}>{d.name}</Text><Text style={styles.dogSub}>{d.fur}</Text><Text style={styles.dogLocation}>⌖  {d.place}</Text></View><View style={styles.dogRight}><Pressable hitSlop={12} onPress={() => setFavorite(v => !v)}><Text style={styles.heart}>{favorite && d.name === 'Mochi' ? '♥' : '♡'}</Text></Pressable><View style={styles.swatches}>{furSwatches(d.fur).map(c => <View key={c} style={[styles.swatch, {backgroundColor:c}]} />)}</View></View></Pressable>) : <Text style={styles.empty}>No dogs found.</Text>}
        <View style={styles.actions}><Pressable style={styles.outlineButton} onPress={() => router.push('/explore/new')}><Text style={styles.buttonText}>Add a dog</Text></Pressable><Pressable style={styles.softButton} onPress={() => setJoined(v => !v)}><Text style={styles.buttonText}>{joined ? 'Walk started ✓' : 'Start a walk'}</Text></Pressable></View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},scroll:{flex:1},content:{paddingHorizontal:20,paddingTop:19,paddingBottom:26,maxWidth:390,width:'100%',alignSelf:'center'},
  heading:{fontSize:26,fontWeight:'800',color:'#28242b'},subtitle:{fontSize:12,color:'#888188',marginTop:5,marginBottom:21},
  search:{height:43,borderWidth:1,borderColor:'#eee7e8',backgroundColor:'#fcfafb',borderRadius:12,flexDirection:'row',alignItems:'center',paddingHorizontal:13,marginBottom:15},searchIcon:{fontSize:24,color:'#8d858b',marginRight:9},input:{flex:1,fontSize:12,color:'#2c292d',height:'100%'},camera:{fontSize:20,color:RED},
  activity:{borderWidth:1,borderColor:'#eee8e9',borderRadius:16,overflow:'hidden'},activityHeader:{paddingHorizontal:13,paddingTop:12,paddingBottom:8},sectionSmall:{fontSize:14,fontWeight:'700',color:'#29262b'},muted:{fontSize:9,color:'#9b949a',marginTop:3},map:{height:112,backgroundColor:'#f3f5f6',overflow:'hidden',position:'relative'},road:{position:'absolute',height:10,backgroundColor:'#fff',borderRadius:10},grass:{position:'absolute',width:47,height:17,borderRadius:20,backgroundColor:'#e0ecd9'},mapLabel:{position:'absolute',backgroundColor:'#fff',borderRadius:4,paddingHorizontal:5,paddingVertical:2},mapLabelText:{fontSize:8,color:'#49444a',fontWeight:'600'},pin:{position:'absolute',width:24,height:24,borderRadius:12,backgroundColor:RED,justifyContent:'center',alignItems:'center'},pinText:{color:'#fff',fontWeight:'700',fontSize:11},mapFooter:{minHeight:57,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:13,paddingVertical:7},mapBold:{fontSize:10,fontWeight:'700',color:'#383138'},arrow:{fontSize:24,color:RED},
  titleRow:{marginTop:17,marginBottom:11,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},sectionTitle:{fontSize:18,fontWeight:'800',color:'#28242b'},link:{fontSize:11,color:RED},dogCard:{borderWidth:1,borderColor:'#eee7e8',borderRadius:15,padding:6,flexDirection:'row',alignItems:'center',marginBottom:9,minHeight:83},dogImage:{width:76,height:70,borderRadius:10,justifyContent:'center',alignItems:'center'},dogInfo:{flex:1,marginLeft:13},dogName:{fontSize:15,fontWeight:'800',color:'#2d272d'},dogSub:{fontSize:11,color:'#8f858b',marginTop:4},dogLocation:{fontSize:10,color:'#898188',marginTop:5},dogRight:{alignItems:'center',justifyContent:'center',paddingHorizontal:8,gap:5},heart:{fontSize:24,color:RED},swatches:{flexDirection:'row',gap:3},swatch:{width:14,height:14,borderRadius:7,borderWidth:1,borderColor:'#e2d8d4'},empty:{fontSize:13,color:'#8b858b',paddingVertical:16},actions:{flexDirection:'row',gap:11,marginTop:9},outlineButton:{flex:1,height:43,borderRadius:12,borderWidth:1,borderColor:'#eee7e8',alignItems:'center',justifyContent:'center'},softButton:{flex:1,height:43,borderRadius:12,backgroundColor:'#fff0f1',alignItems:'center',justifyContent:'center'},buttonText:{color:RED,fontSize:12,fontWeight:'700'}
});
