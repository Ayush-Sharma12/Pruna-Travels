export interface Testimonial {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Priya Sharma",
    location: "Mumbai",
    text: "Our Kashmir trip with Purna Travels was absolutely magical! Every detail was taken care of — from the houseboat stay to the Gulmarg excursion. Highly recommended!",
    rating: 5,
  },
  {
    id: "2",
    name: "Rahul Verma",
    location: "Delhi",
    text: "The Andaman package exceeded all expectations. Crystal clear waters, amazing diving experience, and seamless arrangements. Will definitely book again!",
    rating: 5,
  },
  {
    id: "3",
    name: "Anita Desai",
    location: "Bangalore",
    text: "Best honeymoon trip ever! The Kashmir Honeymoon Package was perfectly planned. The candlelight dinner by the river was the highlight. Thank you Purna Travels!",
    rating: 5,
  },
];

