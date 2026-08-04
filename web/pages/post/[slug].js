// Slugged post URLs (e.g. /post/my-headline) use the same page + data loading
// as /post?id=... — re-export both the page and getServerSideProps.

export { default, getServerSideProps } from '../post';
