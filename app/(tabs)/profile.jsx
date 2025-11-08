import { useEffect, useState } from 'react'
import { View, Text, Alert, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import {useRouter} from "expo-router";
import { API_URL } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';
import styles from '../../assets/styles/profile.styles';
import LogoutButton from '../../components/LogoutButton';
import ProfileHeader from '../../components/ProfileHeader';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/colors';
import { Image } from 'expo-image';

export default function Profile() {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {token} = useAuthStore();
  const router = useRouter();

  const fetchBooks = async () => {
    try {
      setIsLoading(true);

      
      const response = await fetch(`${API_URL}/books/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch user books");

      
      setBooks(data);
     
    } catch (error) {
        console.log("Error fetching data", error);
        Alert.alert("Error", "Failed to load profile data. Pull down to refresh.");
    }finally{
        setIsLoading(false);
    }
  }
  
  useEffect(() => {
    fetchBooks();
  }, []);

    const renderRatingStars = (rating) => {
    const stars = [];
    for(let i=1; i<=5; i++){
      stars.push(
        <Ionicons 
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
   }

  const handleDeleteBook = async (bookId) => {
    try {
        const response = await fetch(`${API_URL}/books/${bookId}`, {
          method: "DELETE",
          headers: {Authorization: `Bearer ${token}`},
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.message || "Failed to delete book");

        setBooks(books.filter((book) => book._id !== bookId));
        Alert.alert("Success", "Recommendation deleted successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to delete recommendaton");      
    }
  }   

    const confirmDelete = (bookId) => {
        Alert.alert("Delete", "Are you sure you want to delete this book?", [
            {text: "Cancel", style: "cancel"},
            {text: "Delete", onPress: () => handleDeleteBook(bookId), style: "destructive"},
        ]);
    }

  const renderBookItem = ({item}) => (
    <View style={styles.bookItem}>
      <Image source={item.image} style={styles.bookImage} />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{item.title}</Text>
        <View style={styles.ratingContainer}>{renderRatingStars(item.rating)}</View>
        <Text style={styles.bookCaption} numberOfLines={2}>{item.caption}</Text>
        <Text style={styles.bookDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(item._id)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>

    </View>
  );

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(500);
    await fetchBooks();
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <ProfileHeader />
      <LogoutButton />
      {/* korisnikcke preporuke */}
      <View style={styles.booksHeader}>
        <Text style={styles.bookTitle}>Your Recommendations</Text>
        <Text style={styles.booksCount}>{books.length} books</Text>
      </View>

      <FlatList 
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.booksList}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={COLORS.primary}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={50} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No recommendations yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
              <Text style={styles.addButtonText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        }

      />


    </View>
  )
}