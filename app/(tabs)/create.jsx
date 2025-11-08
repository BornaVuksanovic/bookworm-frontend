import { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView,TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from "expo-router";
import styles from "../../assets/styles/create.styles";
import COLORS from '../../constants/colors';
import {Ionicons} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';

export default function Create() {
  const [title,setTitle] = useState("");
  const [caption,setCaption] = useState("");
  const [rating,setRating] = useState(3);
  const [image,setImage] = useState(null);
  const [imageBase64,setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const {token} = useAuthStore();
  console.log(token);
  console.log("Sending request to:", `${API_URL}/books`);
  const pickImage = async () => {
    try {
      // request permission if needed
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "We need camera roll permissions to upload an image");
          return;
        }
      }

      // pokreni galeriju
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4,3],
        quality: 0.1, // lower quality for smaller base64
        base64: true,
      });

      if(!result.canceled) {
        setImage(result.assets[0].uri);

        // ako je base64 provided, use it

        if (result.assets[0].base64){
            setImageBase64(result.assets[0].base64);
        }else{
          // pretvori u base64
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(base64);
        }

      }

    } catch (error) {
        console.error("Error picking image:", error);
        Alert.alert("Error", "There was a problem selecting your image");
    }

  }


  const handleSubmit = async () => {
    if(!title || !caption || !imageBase64 || !rating) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      // dohvati file extenziju iz URI ili default jpeg
      const uriParts = image.split(".");
      const length = uriParts.length;
      const fileType = uriParts[length - 1];
      const imageType = fileType ? `image/${fileType.toLowerCase()}` : "image/jpeg";

      const imageDataUrl = `data:${imageType};base64,${imageBase64}`;
  
      console.log("Sending request to:", `${API_URL}/books`);
      console.log("Token being sent:", token);

      const response = await fetch(`${API_URL}/books`, {
        method:"POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title, 
          caption,
          rating: rating.toString(),
          image: imageDataUrl,
        }),
      });
 


      const data = await response.json();
      if(!response.ok) throw new Error(data.message || "Something went wrong");

      Alert.alert("Success", "Your book recommendation has been posted!");

      setTitle("");
      setCaption("");
      setRating(3);
      setImage(null);
      setImageBase64(null);
      router.push("/");

    } catch (error){
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message || "Something went wrong");

    } finally{
      setLoading(false);
    }

  };

  const renderRatingPicker = () => {
    const stars = [];
    for (let i =1; i<=5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} 
        style={styles.starButton}>
          <Ionicons 
            name={i <= rating ? "star" : "star-outline"}
            size={32}
            color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />

        </TouchableOpacity>
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} style={styles.scrollViewStyle}>
        <View style={styles.card}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Book</Text>
            <Text style={styles.subtitle}>Share your favorite reads with others</Text>
          </View>

          <View style={styles.form}>
            {/* naslov knjige */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book title</Text>
              <View style={styles.inputContainer}>
                <Ionicons  
                  name="book-outline"
                  size={20}
                  color={COLORS}
                  style={styles.inputIcon}
                />
                <TextInput 
                  style={styles.input}
                  placeholder="Enter book title"
                  placeholderTextColor={COLORS.placeholderTextColor}
                  value={title}
                  onChangeText={setTitle}
                />          
              </View>
            </View>

            {/* OCJENA */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Your rating</Text>
              {renderRatingPicker()}
            </View>

            {/* slika */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Image</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) 
                : 
                (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="image-outline" size={40} color={COLORS.textSecondary} />
                    <Text style={styles.placeholderText}>Tap to select image</Text>
                  </View>
                )}

              </TouchableOpacity>

            </View>

            {/* caption */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput style={styles.textArea} 
                placeholder="Write your review or thoughts about this book..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>

            {/* submit */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} /> 
              ) 
              :
              (
                <>
                  <Ionicons 
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                    <Text style={styles.buttonText}>Share</Text>
        
                </>
              )
            
            }

            </TouchableOpacity>

          </View>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  )
}