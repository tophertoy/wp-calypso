/** @format */
/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { noop } from 'lodash';
import Gridicon from 'gridicons';
import { localize } from 'i18n-calypso';
import page from 'page';

/**
 * Internal dependencies
 */
import SiteIcon from 'blocks/site-icon';
import SiteIndicator from 'my-sites/site-indicator';
import { getSite, isSitePreviewable } from 'state/sites/selectors';
import { recordGoogleEvent, recordTracksEvent } from 'state/analytics/actions';
import { getSelectedSiteId } from 'state/ui/selectors';
import { getCurrentUser } from 'state/current-user/selectors';
import getPrimarySiteId from 'state/selectors/get-primary-site-id';

class Site extends React.Component {
	static defaultProps = {
		// onSelect callback
		onSelect: noop,
		// mouse event callbacks
		onMouseEnter: noop,
		onMouseLeave: noop,

		// Set a href attribute to the anchor
		href: null,

		// Choose to show the SiteIndicator
		indicator: true,

		// Mark as selected or not
		isSelected: false,

		homeLink: false,
		// if homeLink is enabled
		showHomeIcon: true,
		compact: false,
	};

	static propTypes = {
		href: PropTypes.string,
		externalLink: PropTypes.bool,
		indicator: PropTypes.bool,
		onSelect: PropTypes.func,
		onMouseEnter: PropTypes.func,
		onMouseLeave: PropTypes.func,
		isSelected: PropTypes.bool,
		isHighlighted: PropTypes.bool,
		site: PropTypes.object,
		siteId: PropTypes.number,
		homeLink: PropTypes.bool,
		showHomeIcon: PropTypes.bool,
		compact: PropTypes.bool,
	};

	onSelect = event => {
		this.props.onSelect( event, this.props.site.ID );
	};

	onMouseEnter = event => {
		this.props.onMouseEnter( event, this.props.site.ID );
	};

	onMouseLeave = event => {
		this.props.onMouseLeave( event, this.props.site.ID );
	};

	onViewSiteClick = event => {
		const { isPreviewable, siteSuffix } = this.props;

		if ( ! isPreviewable ) {
			this.trackMenuItemClick( 'view_site_unpreviewable' );
			this.props.recordGoogleEvent( 'Sidebar', 'Clicked View Site | Unpreviewable' );
			return;
		}

		if ( event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ) {
			this.trackMenuItemClick( 'view_site_modifier' );
			this.props.recordGoogleEvent( 'Sidebar', 'Clicked View Site | Modifier Key' );
			return;
		}

		event.preventDefault();
		this.trackMenuItemClick( 'view_site' );
		this.props.recordGoogleEvent( 'Sidebar', 'Clicked View Site | Calypso' );
		page( '/view' + siteSuffix );
	};

	trackMenuItemClick = menuItemName => {
		this.props.recordTracksEvent(
			'calypso_mysites_sidebar_' + menuItemName.replace( /-/g, '_' ) + '_clicked'
		);
	};

	render() {
		const { site, translate } = this.props;

		if ( ! site ) {
			// we could move the placeholder state here
			return null;
		}

		// Note: Update CSS selectors in SiteSelector.scrollToHighlightedSite() if the class names change.
		const siteClass = classnames( {
			site: true,
			'is-jetpack': site.jetpack,
			'is-primary': site.primary,
			'is-private': site.is_private,
			'is-redirect': site.options && site.options.is_redirect,
			'is-selected': this.props.isSelected,
			'is-highlighted': this.props.isHighlighted,
			'is-compact': this.props.compact,
		} );

		return (
			<div className={ siteClass }>
				<button
					className="site__content"
					data-tip-target={ this.props.tipTarget }
					title={
						this.props.homeLink
							? translate( 'View %(domain)s', {
									args: { domain: site.domain },
							  } )
							: site.domain
					}
					onClick={ this.onViewSiteClick }
					onMouseEnter={ this.onMouseEnter }
					onMouseLeave={ this.onMouseLeave }
					aria-label={
						this.props.homeLink
							? translate( 'View %(domain)s', {
									args: { domain: site.domain },
							  } )
							: site.domain
					}
				>
					<SiteIcon site={ site } size={ this.props.compact ? 24 : 32 } />
					<div className="site__info">
						<div className="site__title">
							{ /* eslint-disable wpcalypso/jsx-gridicon-size */ }
							{ this.props.site.is_private && (
								<span className="site__badge">
									<Gridicon icon="lock" size={ 14 } />
								</span>
							) }
							{ site.options && site.options.is_redirect && (
								<span className="site__badge">
									<Gridicon icon="block" size={ 14 } />
								</span>
							) }
							{ site.options && site.options.is_domain_only && (
								<span className="site__badge">
									<Gridicon icon="domains" size={ 14 } />
								</span>
							) }
							{ /* eslint-enable wpcalypso/jsx-gridicon-size */ }
							{ site.title }
						</div>
						<div className="site__domain">
							{ this.props.homeLink
								? translate( 'View %(domain)s', {
										args: { domain: site.domain },
								  } )
								: site.domain }
						</div>
					</div>
					{ this.props.homeLink && this.props.showHomeIcon && (
						<span className="site__home">
							<Gridicon icon="house" size={ 18 } />
						</span>
					) }
				</button>
				{ this.props.indicator ? <SiteIndicator site={ site } /> : null }
			</div>
		);
	}
}

function mapStateToProps( state ) {
	const currentUser = getCurrentUser( state );
	const selectedSiteId = getSelectedSiteId( state );
	const isSingleSite = !! selectedSiteId || currentUser.site_count === 1;
	const siteId = selectedSiteId || ( isSingleSite && getPrimarySiteId( state ) ) || null;
	const site = getSite( state, siteId );

	return {
		isPreviewable: isSitePreviewable( state, siteId ),
		siteId,
		site,
		siteSuffix: site ? '/' + site.slug : '',
	};
}

export default connect(
	mapStateToProps,
	{
		recordGoogleEvent,
		recordTracksEvent,
	}
)( localize( Site ) );
